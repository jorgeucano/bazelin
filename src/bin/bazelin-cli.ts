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

import { join } from 'path';
import { args } from '../args-parser';
import { readProjectDependencies } from '../read-dependencies';
import { readFilesList } from '../read-files-list';


async function main(_args: { srcPath: string, rootDir: string }) {
  const absSrcPath = join(_args.rootDir, _args.srcPath);
  const filesTree = await readFilesList(absSrcPath);
  const dependencies = await readProjectDependencies(absSrcPath);
  console.log(filesTree);

}

main(args);
