/*
master plan
1. read files
2. create dependencies tree
3. analyse imports tree of ts\sass
4. replace ~ in sass with relative paths
5. replace sass imports in angular components with css imports
6. reuse @anguar/bazel templates
7. analyse tsconfig.path aliases
 */

/*
Sorting internal vs external imports
1. Read package.json from dependencies list or node_modules list?
2. Read tsconfig.json:.paths for local aliases
*/

/*
1. Read all file names
2. Read Dependencies
3. TODO: create isLocalImport or is 3rd party import check
*/

import {spawnSync} from 'child_process';
import {writeFile} from 'fs-extra';
import {dirname, join, relative} from 'path';
import {args, CliArgs} from '../args-parser';
import {_isCssFile, _isMainProd, _isSassFile, _isTsFile, _isTsSpecFile} from '../file-utils/file-ext-patterns';
import {readProjectDependencies} from '../file-utils/read-dependencies';
import {readWorkSpace} from '../file-utils/read-workspace';
import {getSassFilesDependencies} from '../lib/sass-processor';
import {getTSFileDependencies} from '../lib/ts-processor';
import {MainProdNgModule} from '../rules/_hack-rules/main-prod-ng-module';
import {isSameFolder} from '../rules/rule-utils';
import {isNgModule} from '../rules/rules-angular/ng-utils';
import {SassBinaryRule} from '../rules/rules-sass/sass-binary';
import {SassLibraryRule} from '../rules/rules-sass/sass-library';
import {BazelinFile, BazelinFolder, BazelinWorkspace} from '../types';
import {NgModuleRule} from '../rules/rules-angular/ng-module.rule';


/*EXTRACT FUNC START*/

async function attachFileDependencies(workspace: BazelinWorkspace) {
  for (const [, file] of workspace.filePathToFileMap) {
    if (_isSassFile.test(file.name)) {
      file.deps = await getSassFilesDependencies(file);
      if (file.deps) {
        for (const dep of file.deps.internal) {
          const _target = workspace.filePathToFileMap.get(dep);
          if (!_target) {
            console.warn(`sass internal dep resolution failed for ${dep}`);
            continue;
          }
          _target.requiredBy.add(file);
        }
      }
    }

    if (_isTsFile.test(file.name)) {
      const ngFilesDeps = await getTSFileDependencies(file, workspace);
      file.deps = ngFilesDeps;
      if (_isTsSpecFile.test(file.path)) {
        // todo: process spec files
        continue;
      }
      if (file.deps) {
        for (const dep of file.deps.internal) {
          const _target = workspace.filePathToFileMap.get(dep);
          if (!_target) {
            console.warn(`ts internal dep resolution failed for ${relative(workspace.rootDir, dep)}`);
            continue;
          }
          _target.requiredBy.add(file);
        }
      }
    }
  }
}

function processFile(file: BazelinFile, workspace: BazelinWorkspace, detectCircular: Set<string>): boolean {
  // Circular dependency detector
  if (detectCircular.has(file.path)) {
    const _circular = [];
    let _startPushing = false;
    detectCircular.forEach((dep: string) => {
      if (!_startPushing && dep === file.path) {
        _startPushing = true;
      }
      if (_startPushing) {
        _circular.push(dep);
      }
    });
    _circular.push(file.path);
    const _toReport = _circular.map(c => relative(join(workspace.rootDir, workspace.srcPath), c)).join(' -> ');
    console.warn(`circular dependency: \n ${_toReport}`);
    detectCircular.delete(file.path);
    return file.isProcessed;
  }
  detectCircular.add(file.path);

  let _rule;
  if (isNgModule(file)) {
    // ng modules are so special
    _rule = NgModuleRule.createFromFile(file, workspace);
    file.rules.add(_rule);
  }


  // process all dependencies before processing file
  if (file.deps) {
    // process internal dependencies
    for (const dep of file.deps.internal) {
      const _depFile = workspace.filePathToFileMap.get(dep);
      if (_depFile && !_depFile.isProcessed) {
        _depFile.isProcessed = processFile(_depFile, workspace, detectCircular);
      }
    }
    // todo: process external dependencies
  }
  detectCircular.delete(file.path);

  if (_isSassFile.test(file.name)) {
    if (file.deps && file.name.startsWith('_')) {
      file.folder.rules.add(SassLibraryRule.createFromFile(file, workspace));
      return true;
    }
    // if (file.requiredBy.size === 0) {
    file.folder.rules.add(SassBinaryRule.createFromFile(file, workspace));
    return true;
    // }
  }

  if (_isCssFile.test(file.name)) {
    file.folder.rules.add(SassLibraryRule.createFromFile(file, workspace));
    return true;
  }

  if (_isTsFile.test(file.name)) {


    if (_isMainProd.test(file.name)) {
      // add it to dependency of child ngModule ???
      // todo: if main.prod.ts is one level above first module
      // todo: first ng module has to be created at main.prod.ts folder
      return true;
    }

    if (isNgModule(file) && _rule) {
      file.folder.rules.add(_rule);
      for (const parent of file.requiredBy) {
        if (isNgModule(parent)) {
          for (const rule of parent.rules) {
            if (rule instanceof NgModuleRule) {
              rule.addExtDeps(file.deps.external);
              return true;
            }
          }
        }
      }
      return true;
    }

    // ng components and other .ts files
    const _depPath = Array
      .from(detectCircular)
      .reverse()
      .map(dep => workspace.filePathToFileMap.get(dep));
    // todo: simplify this reverse engineer
    for (const _ngModule of _depPath) {
      if (!_ngModule || !isNgModule(_ngModule)) {
        continue;
      }
      for (const rule of _ngModule.rules) {
        if (rule instanceof NgModuleRule) {
          rule.addDeps(file);
          return true;
        }
      }
    }

    return true;
  }

  // todo: change to false
  return true;
}

/* Create full BUILD file content */
function processFolder(folder: BazelinFolder) {
  // sorry folks, all the things are public :D
  const visibility = `package(default_visibility = ["//visibility:public"])`;
  const _load = [];
  const _actions = [];

  const loadsMap = new Map<string, Set<string>>();
  for (const rule of folder.rules) {
    // generate load statements like
    // load("@io_bazel_rules_sass//:defs.bzl", "sass_library", "sass_binary")
    if (!loadsMap.has(rule.loadFrom)) {
      loadsMap.set(rule.loadFrom, new Set());
    }

    const _toLoad = loadsMap.get(rule.loadFrom);
    if (_toLoad) {
      _toLoad.add(rule.ruleName);
    }

    // generate actions
    _actions.push(rule.generate());
  }

  for (const [loadFrom, ruleNames] of loadsMap) {
    const words = [loadFrom, ...Array.from(ruleNames)]
      .map(word => `"${word}"`)
      .join(', ');
    _load.push(`load(${words})`);
  }

  // do nothing, is my favourite kind of doing
  if (!_load.length && !_actions.length) {
    return '';
  }

  return [visibility, ..._load, ..._actions].join('\n\n');
}

/* Will find entry points (files which is not required by no one)
and process whole tree of dependencies
1. We are looking for sass entry points
2. todo: We are looking for ngModule entry points
*/
function processRootFolder(workspace: BazelinWorkspace) {
  const entryPoints = Array.from(workspace.filePathToFileMap)
    .map((value: [string, BazelinFile]) => value[1])
    .filter((file: BazelinFile) => file.requiredBy.size === 0);

  entryPoints.forEach((entryPoint: BazelinFile) => {
    const detectCircular = new Set();
    if (_isTsSpecFile.test(entryPoint.name)) {
      // todo: process test files
      return;
    }
    console.log(`entry point ${relative(workspace.rootDir, entryPoint.path)}`);
    processFile(entryPoint, workspace, detectCircular);
  });
}


// process main.prod.ts
function processMainEntry(workspace: BazelinWorkspace) {
  /*
  1. find main.prod.ts
  2. find additional entry points (ts and sass)
  3. generate ngModule for whole app for main.prod.ts
  4. generate rollup for whole app for main.prod.ts
  */
  const _findMainProd = Array.from(workspace.filePathToFileMap)
    .map((value: [string, BazelinFile]) => value[1])
    .filter((file: BazelinFile) => _isMainProd.test(file.path));
  if (!_findMainProd || !_findMainProd.length) {
    throw Error(`main.prod.ts not found in ${workspace.rootDir}, please check "bazelin" docs and create one`);
  }
  const _mainProd = _findMainProd[0];

  const entryPoints = Array.from(workspace.filePathToFileMap)
    .map((value: [string, BazelinFile]) => value[1])
    .filter((file: BazelinFile) => file.requiredBy.size === 0);

  entryPoints.forEach((entryPoint: BazelinFile) => {
    if (_isTsFile.test(entryPoint.path) && isNgModule(entryPoint)) {
      _mainProd.deps.internal.add(entryPoint.path);
      for (const dep of entryPoint.deps.external) {
        _mainProd.deps.external.add(dep);
      }
    }
    if (_isSassFile.test(entryPoint.path)) {
      _mainProd.deps.internal.add(entryPoint.path);
    }
  });

  workspace.srcFolder.rules.add(MainProdNgModule.createFromFile(_mainProd, workspace));
}

// find folders with 2+ ngModuleRules
// if modules are dependant
// merge child to parent
// remove child rule from folder
function mergeNgModules(workspace: BazelinWorkspace): void {
  for (const [, folder] of workspace.folderPathToFolderMap) {
    const folderNgRules = Array.from(folder.rules)
      .filter(rule => (rule instanceof NgModuleRule)) as NgModuleRule[];
    if (folderNgRules.length < 2) {
      continue;
    }

    // todo: make parent search simplier
    for (const rule of folderNgRules) {
      for (const reqBy of rule.file.requiredBy) {
        if (!isSameFolder(reqBy.path, rule.file.path)) {
          continue;
        }

        for (const parent of folderNgRules) {
          if (parent.file.path !== reqBy.path) {
            continue;
          }

          parent.mergeChildNgModule(rule);
          folder.rules.delete(rule);
        }
      }
    }
  }
}


/*EXTRACT FUNC END*/

/*
1. Read workspace structure
2. Do tree walk-through
3. Generation actions
4. Create bazel command types
5. Generate bazel build files
6. Hope for blind luck :D
*/
async function main(_args: CliArgs) {
  const dependencies = await readProjectDependencies(_args.rootDir);
  const srcFolder: BazelinFolder = {
    path: _args.srcPath,
    files: new Set(),
    folders: new Set(),
    rules: new Set(),
    buildFile: ''
  };
  const workspace = await readWorkSpace({
    ..._args,
    srcFolder,
    projectDeps: dependencies,
    filePathToFileMap: new Map(),
    folderPathToFolderMap: new Map([[_args.srcPath, srcFolder]])
  });

  await attachFileDependencies(workspace);

  processRootFolder(workspace);
  // 2 modules in the same folder should be merged if dependant
  // todo: if 2 modules import same component\directive\etc, child module should be merged in parent
  mergeNgModules(workspace);
  processMainEntry(workspace);
  for (const [, folder] of workspace.folderPathToFolderMap) {
    folder.buildFile = processFolder(folder);
    if (folder.buildFile) {
      const _outPath = join(workspace.rootDir, folder.path, `BUILD.bazel`);
      await writeFile(_outPath, folder.buildFile);
      // todo: make it smarter ;)
      spawnSync('./node_modules/.bin/buildifier', [_outPath], {stdio: 'inherit'});
    }
  }

  console.log('done');
}

main(args);
