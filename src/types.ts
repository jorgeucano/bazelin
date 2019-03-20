import { BazelRule } from './rules/bazel-rule.model';

export interface ProjectDependencies {
  pathMappings: Array<[string, string[]]>;
  internal: string[];
  external: string[];
}

export interface BazelinFileDeps {
  // deps on node_modules
  external: Set<string>;
  // deps on files inside the project
  internal: Set<string>;
}

export interface BazelinFile {
  /* file name with extension */
  name: string;
  /* absolute file path */
  path: string;
  /* pointer to folder in which file is */
  folder: BazelinFolder;
  /* map of dependencies */
  deps?: BazelinFileDeps;
  /* this file is required by other files */
  requiredBy: Set<BazelinFile>;
  /* is this file processed? yes - means rules are generated */
  isProcessed: boolean;
}

export interface BazelinFolder {
  /* relative path to folder */
  path: string;
  /* folders in this folder */
  folders: Set<BazelinFolder>;
  /* files in this folder */
  files: Set<BazelinFile>;

  /* set of bazel rules related to this file */
  rules: Set<BazelRule>;

  buildFile: string;
}

export interface BazelinWorkspace {
  /* absolute path to workspace root folder */
  rootDir: string;
  /* relative path to src folder where bazel config should be bootstrapped */
  srcPath: string;
  srcFolder: BazelinFolder;

  projectDeps: ProjectDependencies;

  /* pointers to all files */
  filePathToFileMap: Map<string, BazelinFile>;
  /* pointers to all folders */
  folderPathToFolderMap: Map<string, BazelinFolder>;
}
