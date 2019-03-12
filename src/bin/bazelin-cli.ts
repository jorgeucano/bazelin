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

import { args } from '../args-parser';
import { readProjectDependencies } from '../file-utils/read-dependencies';
import { readWorkSpace } from '../file-utils/read-workspace';
import { readFile } from 'fs-extra';

const gonzales = require('gonzales-pe');

/* EXTRACT START  */
export interface BazelinFile {
  /* file name with extension */
  name: string;
  /* absolute file path */
  path: string;

  /* pointer to folder in which file is */
  folder: BazelinFolder;
}

export interface BazelinFolder {
  /* relative path to folder */
  path: string;
  /* folders in this folder */
  folders: Set<BazelinFolder>;
  /* files in this folder */
  files: Set<BazelinFile>;
}

export interface Workspace {
  /* absolute path to workspace root folder */
  rootDir: string;
  /* relative path to src folder where bazel config should be bootstrapped */
  srcPath: string;
  srcFolder: BazelinFolder;

  /* pointers to all files */
  filePathToFileMap: Map<string, BazelinFile>;
  /* pointers to all folders */
  folderPathToFolderMap: Map<string, BazelinFolder>;
}

export interface SassFilesDeps {
  filePath: string;
  external: Set<string>;
  internal: Set<string>;
}

/* EXTRACT END */

/* should return a list of internal and external dependencies
 * from given file to other sass files and assets (like fonts) */
async function getSassFilesDependencies(file: BazelinFile) {

  const fileDeps = await readFile(file.path, 'utf8');
  const parsed = gonzales.parse(fileDeps, {syntax: 'scss'});

  const depsFiles: SassFilesDeps = {
    filePath: file.path,
    external: new Set(),
    internal: new Set()
  };

  parsed.forEach('atrule', (node: any, index: number) => {
    const atkeyword = node.first('atkeyword').first('ident');

    if (atkeyword.content !== 'import') {
      return;
    }

    const importNode = node.first('string');
    const importString = importNode.content;

    if (importString[1] === '~') {
      const _importString = importString.substr(2, importString.length - 1);
      importNode.content = [importString[0], _importString, importString[importString.length]].join('');

      depsFiles.external.add(importNode.content);
    } else {
      depsFiles.internal.add(importNode.content);
    }
  });
  console.log(depsFiles);
  return null;
}

/* should return a list of dependencies from give file to:
- external modules (3rd party)
- internal TS files
- html and sass files (from Component Metadata)
  */
async function getTSFileDependencies(file: BazelinFile) {
  return null;
}

/*EXTRACT FUNC START*/
const _isSassFile = /\.(sass|scss)$/;

async function readFilesDependencies(workspace: Workspace) {
  await workspace.filePathToFileMap.forEach(async (file, filePath) => {
    if (_isSassFile.test(file.name)) {
      const sassFilesDependecies = await getSassFilesDependencies(file);
    }

    if (/\.ts/.test(file.name)) {
      const tsFileDependecies = await getTSFileDependencies(file);
    }
    // console.log(filePath); // TODO return to uncomment
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
async function main(_args: { srcPath: string, rootDir: string }) {

  const dependencies = await readProjectDependencies(_args.rootDir);
  const srcFolder = {
    path: _args.srcPath,
    files: new Set(),
    folders: new Set()
  };
  const workspace = await readWorkSpace({
    ..._args,
    srcFolder,
    filePathToFileMap: new Map(),
    folderPathToFolderMap: new Map([[_args.srcPath, srcFolder]])
  });

  await readFilesDependencies(workspace);

  console.log('done');
}

main(args);
