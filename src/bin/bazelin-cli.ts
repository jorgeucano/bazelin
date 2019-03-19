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

import { writeFile } from 'fs-extra';
import { join } from 'path';
import { args, CliArgs } from '../args-parser';
import { readProjectDependencies } from '../file-utils/read-dependencies';
import { readWorkSpace } from '../file-utils/read-workspace';
import { getSassFilesDependencies } from '../lib/sass-processor';
import { getTSFileDependencies } from '../lib/ts-processor';
import { SassBinaryRule } from '../rules/rules-sass/sass-binary';
import { SassLibraryRule } from '../rules/rules-sass/sass-library';
import { BazelinFile, BazelinFolder, BazelinWorkspace } from '../types';


/* EXTRACT START  */

export function generateSassRule(file: BazelinFile) {

}

/* EXTRACT END */


/*EXTRACT FUNC START*/
const _isSassFile = /\.(sass|scss)$/;
const _isCssFile = /\.css$/;

async function attachFileDependencies(workspace: BazelinWorkspace) {
  for (const [, file] of workspace.filePathToFileMap) {
    if (_isSassFile.test(file.name)) {
      file.deps = await getSassFilesDependencies(file);
      if (file.deps) {
        for (const dep of file.deps.internal) {
          const _target = workspace.filePathToFileMap.get(dep);
          if (!_target) {
            continue;
          }
          _target.requiredBy.add(file);
        }
      }
    }

    if (/\.ts/.test(file.name)) {
      const tsFileDependecies = await getTSFileDependencies(file, args);
    }
  }
}

function processFile(file: BazelinFile, workspace: BazelinWorkspace): boolean {
  // process all dependencies before processing file
  if (file.deps) {
    // process interal dependencies
    for (const dep of file.deps.internal) {
      const _depFile = workspace.filePathToFileMap.get(dep);
      if (_depFile && !_depFile.isProcessed) {
        _depFile.isProcessed = processFile(_depFile, workspace);
      }
    }
    // todo: process external dependencies
  }

  if (_isSassFile.test(file.name)) {
    if (file.deps && file.name.startsWith('_')) {
      file.folder.rules.add(SassLibraryRule.createFromFile(file, workspace));
      return true;
    }
    if (file.requiredBy.size === 0) {
      file.folder.rules.add(SassBinaryRule.createFromFile(file, workspace));
      return true;
    }
  }

  // todo: should it be included in filegroup? cuz css file is not copied to output
  if (_isCssFile.test(file.name)) {
    file.folder.rules.add(SassLibraryRule.createFromFile(file, workspace));
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


  return [visibility, ..._load, ..._actions].join('\n\n');
}

/* Will find entry points (files which is not required by no one)
and process whole tree of dependencies
*/
function processRootFolder(workspace: BazelinWorkspace) {
  const entryPoints = Array.from(workspace.filePathToFileMap)
    .map((value: [string, BazelinFile]) => value[1])
    .filter((file: BazelinFile) => file.requiredBy.size === 0);

  entryPoints.forEach((entryPoint: BazelinFile) => {
    processFile(entryPoint, workspace);
  });
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
    filePathToFileMap: new Map(),
    folderPathToFolderMap: new Map([[_args.srcPath, srcFolder]])
  });

  await attachFileDependencies(workspace);

  processRootFolder(workspace);

  for (const [, folder] of workspace.folderPathToFolderMap) {
    folder.buildFile = processFolder(folder);
    await writeFile(join(folder.path, `BUILD_res.bazel`), folder.buildFile);
  }

  console.log('done');
}

main(args);
