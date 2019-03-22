import {readFile, stat} from 'fs-extra';
import {dirname, join} from 'path';
import * as ts from 'typescript';
import {SourceFile} from 'typescript';

import {tsquery} from '@phenomnomnominal/tsquery';
import {_isCssFile, _isSassFile} from '../file-utils/file-ext-patterns';
import {markAsNgModule} from '../rules/rules-angular/ng-utils';

import {BazelinFile, BazelinFileDeps, BazelinWorkspace, ProjectDependencies} from '../types';


/* Credits for extracting lazy loading dependencies goes to
 https://github.com/phenomnomnominal/angular-lazy-routes-fix/blob/master/src/noLazyModulePathsRule.ts
 */
// Constants:
const LOAD_CHILDREN_SPLIT = '#';
const LOAD_CHILDREN_VALUE_QUERY = `StringLiteral[value=/.*${LOAD_CHILDREN_SPLIT}.*/]`;
const LOAD_CHILDREN_ASSIGNMENT_QUERY = `PropertyAssignment:not(:has(Identifier[name="children"])):has(Identifier[name="loadChildren"]):has(${LOAD_CHILDREN_VALUE_QUERY})`;

const NGMODULE_DECORATOR = `Decorator:has(Identifier:has([name=NgModule]))`;

const IMPORTS = `ImportDeclaration:has(StringLiteral)`;
const EXPORTS = `ExportDeclaration:has(StringLiteral)`;

// const TEMPLATE_URLS = `Decorator:has(PropertyAssignment:has(Identifier:has([name=templateUrl])))`;
const COMPONENTS_OR_DIRECTIVES = `Decorator:has(Identifier[name=/Component|Directive/])`;
const TEMPLATE_URLS = `PropertyAssignment:has(Identifier[name=templateUrl]):has(StringLiteral)`;
const STYLE_URLS = `PropertyAssignment:has(Identifier[name=styleUrls]):has(ArrayLiteralExpression)`;

export interface NgFilesDeps extends BazelinFileDeps {
  lazyInternal: Set<string>;
  html: Set<string>;
  styles: Set<string>;
}

/* should return a list of dependencies from give file to:
- external modules (3rd party)
- internal TS files
- html and sass files (from Component Metadata)
- create a list of angular lazy loading deps from routing
*/

export async function getTSFileDependencies(file: BazelinFile, workspace: BazelinWorkspace) {
  const projectDependencies: ProjectDependencies = workspace.projectDeps;

  const fileContent = await readFile(file.path, 'utf8');
  const AST: SourceFile = ts.createSourceFile(file.path, fileContent, ts.ScriptTarget.Latest, true);

  const _isExtDepStr = projectDependencies.external.join('|').replace(/@/g, '\\@');
  // it's hard to believe you don't have npm deps, but just in case ;)
  const _isExtDep = projectDependencies.external.length ? new RegExp(_isExtDepStr) : {test: (_: string) => false};
  const _isIntDepStr = projectDependencies.internal
    .map((v: string) => v.replace('/*', ''))
    .join('|')
    .replace(/@/g, '\\@');
  // if tsconfig path mapping mappings are empty
  const _isPathMapping = projectDependencies.internal.length ? new RegExp(_isIntDepStr) : {test: (_: string) => false};

  const depsFiles: NgFilesDeps = {
    external: new Set(),
    internal: new Set(),
    lazyInternal: new Set(),
    html: new Set(),
    styles: new Set()
  };

  // Sort out external and internal dependencies
  function _processDependency(tsFileDeps: NgFilesDeps, text: string) {
    // check if imports is done to one of tsconfig aliases
    if (_isPathMapping.test(text)) {
      tsFileDeps.internal.add(text);
      return;
    }

    // check if import is relative (starts with dot)
    if (text.startsWith('.')) {
      tsFileDeps.internal.add(text);
      return;
    }

    // check if import from npm module
    if (_isExtDep.test(text)) {
      tsFileDeps.external.add(text);
      return;
    }

    console.warn(`Unresolved dependency ${text} in ${file.path}`);
    tsFileDeps.external.add(text);
  }

  /* RESOLVE INTERNAL TS FILES DEPENDENCIES START */
  // Process import statements
  tsquery(fileContent, IMPORTS).map((statement: any) => {
    _processDependency(depsFiles, statement.moduleSpecifier.text);
  });

  // Process export statements
  tsquery(fileContent, EXPORTS).map((statement: any) => {
    if (statement.moduleSpecifier) {
      _processDependency(depsFiles, statement.moduleSpecifier.text);
    }
  });

  // A list of absolute paths to internal dependencies
  const _internals = new Set<string>();
  for (const dep of depsFiles.internal) {
    _internals.add(await resolveTs(file.path, dep, workspace.rootDir, workspace.projectDeps.pathMappings));
  }

  depsFiles.internal = _internals;

  /* RESOLVE INTERNAL TS FILES DEPENDENCIES END */

  // Mark as ngModule if found @NgModule decorator
  tsquery(fileContent, NGMODULE_DECORATOR).map(result => {
    markAsNgModule(file);
  });


  // Process style and template URLs in Components and Directives
  tsquery(fileContent, COMPONENTS_OR_DIRECTIVES).map(decorator => {
    tsquery(decorator, TEMPLATE_URLS).map((statement: any) => {
      depsFiles.html.add(statement.initializer.text);
    });

    tsquery(decorator, STYLE_URLS).map((statement: any) => {
      statement.initializer.elements.forEach((_styleUrls: any) => {
        // todo: [Bazel Blocker] as for now .sass|.scss|.less imports should be reported
        // .css imports should be converted into deps to .sass files
        // and put to internal dependencies
        depsFiles.styles.add(_styleUrls.text);
      });
    });
  });

  // process html dependencies
  for (const dep of depsFiles.html) {
    depsFiles.internal.add(await _resolveHtml(file.path, dep));
  }

  // process style dependencies
  for (const dep of depsFiles.styles) {
    depsFiles.internal.add(await _resolveStyles(file.path, dep));
  }

  // process/hack external dependencies
  const _cheatList: {[key: string]: string[]} = {
    '@angular/platform-browser/animations': ['@angular/platform-browser', '@angular/animations']
  };
  for (const dep of depsFiles.external) {
    if (dep in _cheatList) {
      depsFiles.external.delete(dep);
      _cheatList[dep].forEach(newDep => depsFiles.external.add(newDep));
    }
  }

  /* RESOLVE LOAD CHILD IN ROUTING START */

  const lazyLoadedPaths: string[] = [];
  tsquery(fileContent, LOAD_CHILDREN_ASSIGNMENT_QUERY).map(result => {
    const [valueNode] = tsquery(result, LOAD_CHILDREN_VALUE_QUERY);
    const [path] = valueNode.text.split(LOAD_CHILDREN_SPLIT);
    lazyLoadedPaths.push(path);
  });

  // problem with lazy loaded modules is:
  // file with route definitions could be in wrong folder
  // so we need to go up by requiredBy chain till we get to router definition
  // todo: but going each time one folder up is good enough approximation for a start;)
  const _lazyInternals = new Set<string>();
  let _tryFromPath = file.path;
  let _exitTime = false;
  for (const dep of lazyLoadedPaths) {
    do {
      try {
        _lazyInternals.add(await resolveTs(_tryFromPath, dep, workspace.rootDir, workspace.projectDeps.pathMappings));
        _exitTime = true;
      } catch (e) {
        // no luck - next
        _exitTime = _tryFromPath === workspace.rootDir;
        _tryFromPath = dirname(_tryFromPath);
      }
    } while (!_exitTime);
  }
  depsFiles.lazyInternal = _lazyInternals;

  /* RESOLVE LOAD CHILD IN ROUTING END  */

  return depsFiles;
}

// support ts path mapping to folders and files
//  "paths": {
//       "@modules/*": ["src/app/modules/*"],
//       "@moduleA": ["src/app/moduleA/index.ts"],
//       "@moduleB/*": ["*"],
function _convertPathMappings(filePath: string, alias: string, paths: string[]): string[] {
  // case  "@moduleA": ["src/app/moduleA/index.ts"],
  if (alias.indexOf('*') === -1) {
    return [alias, paths[0]];
  }

  const _alias = alias.replace('/*', '');
  const _ts = '.ts';
  const _index = './index.ts';

  const _result = paths
    .map(path => path.replace('/*', ''))
    .map(path => [_alias, path])
    .reduce((memo: string[], pathMap: string[]) => {
      memo.push(filePath.replace(pathMap[0], pathMap[1]) + _ts);
      memo.push(join(filePath.replace(pathMap[0], pathMap[1]), _index));
      return memo;
    }, []);
  return _result;
}

/*
Resolve internal (relative and path mapping) imports to real file path
we are interested only subset of name resolutions

import { b } from "./moduleB" in /root/src/moduleA.ts
->
/root/src/moduleB.ts
/root/src/moduleB/index.ts

with path mapping

todo: figure it out how make it better
todo: https://www.typescriptlang.org/docs/handbook/module-resolution.html

*/

// todo: most probably I could avoid this complication if could make ts.resolveModuleName work!
async function resolveTs(fromFile: string, toPath: string, rootDir: string, pathMappings: Array<[string, string[]]>): Promise<string> {
  const _ts = '.ts';
  const _index = './index.ts';
  const _ngFactory = '.ngfactory';
  const _baseFolder = dirname(fromFile);
  const _path0 = join(_baseFolder, toPath);
  const _path1 = join(_baseFolder, toPath) + _ts;
  const _path2 = join(_baseFolder, toPath, _index);
  // special for AOT
  const _path3 = join(_baseFolder, toPath.replace(_ngFactory, _ts));

  // [RegExt for test, alias, paths]
  const aliasesWithTest = pathMappings.map(pathMapping => [
    new RegExp(pathMapping[0]
      .replace('/*', '')
      .replace(/@/g, '\\@')),
    pathMapping[0],
    pathMapping[1]]);

  const _mappedPaths = aliasesWithTest
    .filter((aliasWithTest) => (aliasWithTest[0] as RegExp).test(toPath))
    .map((aliasWithTest => _convertPathMappings(toPath, aliasWithTest[1] as string, aliasWithTest[2] as string[])));
  const _flatMapPaths = [].concat(..._mappedPaths as any);
  const _pathsToTest = _flatMapPaths.map((_aliasPath: string) => join(rootDir, _aliasPath));

  return Promise.all([
    _testFile(_path0),
    _testFile(_path1),
    _testFile(_path2),
    _testFile(_path3),
    ..._pathsToTest.map(_pathToTest => _testFile(_pathToTest))
  ])
    .then((results: string[]) => {
      const _success = results.filter((result: string) => !!result);
      if (!_success.length) {
        throw new Error(`Could not resolve "${toPath}" from "${fromFile}"`);
      }
      if (_success.length > 1) {
        throw new Error(`Unknown things are happening "${toPath}" from "${fromFile}"`);
      }
      return _success[0];
    });
}

async function _testFile(filePath: string): Promise<string> {
  try {
    const _stats = await stat(filePath);
    return _stats.isFile() ? filePath : '';
  } catch (e) {
    return '';
  }
}

async function _resolveHtml(fromFile: string, toPath: string): Promise<string> {
  const _path = join(dirname(fromFile), toPath);
  if (await _testFile(_path)) {
    return _path;
  }

  throw new Error(`Could not resolve ${toPath} from ${fromFile}`);
}

async function _resolveStyles(fromFile: string, toPath: string): Promise<string> {
  // todo: angular + bazel doesn't support imports from .scss or sass files with bazel
  // todo: so you should replace it with .css imports
  if (!_isCssFile.test(toPath)) {
    throw new Error(`Please rename ${toPath} to .css in ${fromFile}`);
  }

  // so the trick is: we depend on css file, but replace it to sass
  // to get css when bazel will compile sass to css
  // magic
  const _pathSass = join(dirname(fromFile), toPath.replace(_isCssFile, '.sass'));
  const _pathScss = join(dirname(fromFile), toPath.replace(_isCssFile, '.scss'));
  const _resolvedSass = await _testFile(_pathSass) || await _testFile(_pathScss);
  if (_resolvedSass) {
    return _resolvedSass;
  }
  throw new Error(`Error: could not resolve ${toPath} from ${fromFile}`);
}
