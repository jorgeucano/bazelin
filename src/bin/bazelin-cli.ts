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

  /* pointers to all folders */
  allFolders: Set<BazelinFolder>;
  /* pointers to all files */
  allFiles: Set<BazelinFile>;
}

/* EXTRACT END */

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
    allFiles: new Set(),
    allFolders: new Set([srcFolder])
  });

  // const filesTree = await readFilesList(absSrcPath);
  console.log(workspace);

}

main(args);
