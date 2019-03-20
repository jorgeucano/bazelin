import { readFile, stat } from 'fs-extra';
import { dirname, join } from 'path';
import { SyntaxKind } from 'typescript';
import * as ts from 'typescript';
import { SourceFile } from 'typescript';

import { tsquery } from '@phenomnomnominal/tsquery';

import { BazelinFile, BazelinFileDeps, BazelinWorkspace, ProjectDependencies } from '../types';


/* Credits for extracting lazy loading dependencies goes to
 https://github.com/phenomnomnominal/angular-lazy-routes-fix/blob/master/src/noLazyModulePathsRule.ts
 */
// Constants:
const LOAD_CHILDREN_SPLIT = '#';
const LOAD_CHILDREN_VALUE_QUERY = `StringLiteral[value=/.*${LOAD_CHILDREN_SPLIT}.*/]`;
const LOAD_CHILDREN_ASSIGNMENT_QUERY = `PropertyAssignment:not(:has(Identifier[name="children"])):has(Identifier[name="loadChildren"]):has(${LOAD_CHILDREN_VALUE_QUERY})`;

export interface TsFilesDeps extends BazelinFileDeps {
  filePath: string;
  html: Set<string>;
  styles: Set<string>;
}

/* should return a list of dependencies from give file to:
- external modules (3rd party)
- internal TS files
- html and sass files (from Component Metadata)
- todo: should create a list of ngModules deps from routing
*/

// todo: use tsquery
export async function getTSFileDependencies(file: BazelinFile, workspace: BazelinWorkspace) {
  const projectDependencies: ProjectDependencies = workspace.projectDeps;

  const fileContent = await readFile(file.path, 'utf8');
  const AST: SourceFile = ts.createSourceFile(file.path, fileContent, ts.ScriptTarget.Latest, true);

  const _isExtDepStr = projectDependencies.external.join('|').replace(/@/g, '\\@');
  const _isExtDep = new RegExp(_isExtDepStr);
  const _isIntDepStr = projectDependencies.internal
    .map((v: string) => v.replace('/*', ''))
    .join('|')
    .replace(/@/g, '\\@');
  const _isPathMapping = new RegExp(_isIntDepStr);

  const depsFiles: TsFilesDeps = {
    filePath: file.path,
    external: new Set(),
    internal: new Set(),
    html: new Set(),
    styles: new Set()
  };

  function _processDependency(tsFileDeps: TsFilesDeps, text: string) {
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

  AST.statements.forEach((statement: any) => {
    switch (statement.kind) {
      case (SyntaxKind.ImportDeclaration):
      case (SyntaxKind.ExportDeclaration):
        if (!statement.moduleSpecifier && statement.kind === SyntaxKind.ExportDeclaration) {
          break;
        }
        _processDependency(depsFiles, statement.moduleSpecifier.text);
        break;
      case (SyntaxKind.ClassDeclaration):
        if (!statement.decorators) {
          // console.log(`statement.decorators `, file.path);
          return;
        }
        statement.decorators.forEach((decorator: any) => {
          if (!decorator.expression.arguments[0]) {
            // console.log (`decorator.expression.arguments[0]`, file.path)
            return;
          }
          decorator.expression.arguments[0].properties.forEach((property: any) => {
            if (property.name.text === 'templateUrl') {
              depsFiles.html.add(property.initializer.text);
            }

            if (property.name.text === 'styleUrls') {
              depsFiles.styles.add(property.initializer.elements[0].text);
            }
          });
        });
        break;
    }
  });

  const lazyLoadedPaths: string[] = [];
  tsquery(fileContent, LOAD_CHILDREN_ASSIGNMENT_QUERY).map(result => {
    const [valueNode] = tsquery(result, LOAD_CHILDREN_VALUE_QUERY);
    const [path] = valueNode.text.split(LOAD_CHILDREN_SPLIT);
    lazyLoadedPaths.push(path);
  });

  // A list of absolute paths to internal dependencies
  const _internals = new Set<string>();

  // problem with lazy loaded modules is:
  // file with route definitions could be in wrong folder
  // so we need to go up by requiredBy chain till we get to router definition
  // todo: but going each time one folder up is good enough approximation for a start;)
  let _tryFromPath = file.path;
  let _exitTime = false;
  for (const dep of lazyLoadedPaths) {
    do {
      try {
        _internals.add(await resolveTs(_tryFromPath, dep, workspace.rootDir, workspace.projectDeps.pathMappings));
        _exitTime = true;
      } catch (e) {
        // no luck - next
        _exitTime = _tryFromPath === workspace.rootDir;
        _tryFromPath = dirname(_tryFromPath);
      }
    } while (!_exitTime);
  }

  for (const dep of depsFiles.internal) {
    _internals.add(await resolveTs(file.path, dep, workspace.rootDir, workspace.projectDeps.pathMappings));
  }

  depsFiles.internal = _internals;
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
  const _baseFolder = dirname(fromFile);
  const _path0 = join(_baseFolder, toPath);
  const _path1 = join(_baseFolder, toPath) + _ts;
  const _path2 = join(_baseFolder, toPath, _index);

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
    _testFile(_path1),
    _testFile(_path2),
    _testFile(_path0),
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
