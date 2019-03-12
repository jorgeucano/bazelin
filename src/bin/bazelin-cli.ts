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
import { ProjectDependencies, readProjectDependencies } from '../file-utils/read-dependencies';
import { readWorkSpace } from '../file-utils/read-workspace';
import { readFileSync } from 'fs';
import * as ts from 'typescript';
import { SyntaxKind, SourceFile } from 'typescript';
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

export interface TsFilesDeps {
  filePath: string;
  external: Set<string>;
  internal: Set<string>;
  html: Set<string>;
  styles: Set<string>;
}

export interface Args {
  srcPath: string;
  rootDir: string;
}

/* EXTRACT END */

/* should return a list of internal and external dependencies
 * from given file to other sass files and assets (like fonts) */
async function getSassFilesDependencies(file: BazelinFile) {
  const fileDeps = await readFile(file.path, 'utf8');
  const parsed = gonzales.parse(fileDeps, { syntax: 'scss' });
  const depsFiles: SassFilesDeps = {
    filePath: file.path,
    external: new Set(),
    internal: new Set()
  };

  parsed.forEach('atrule', async (node: any, index: number) => {
    const atkeyword = node.first('atkeyword').first('ident');

    if (atkeyword.content !== 'import') {
      return;
    }

    const importNode = node.first('string');
    const importString = importNode.content;

    if (importString[1] === '~') {
      const _importString = importString.substr(2, importString.length - 3);
      depsFiles.external.add(_importString);
      return;
    }

    const nodeModules = 'node_modules/';
    if (importString.indexOf(nodeModules) !== -1) {
      const offset = importString.indexOf(nodeModules) + nodeModules.length;
      const _importString = importString.substr(offset, importString.length - offset - 1)
      depsFiles.external.add(_importString);
      return;
    }

    const _internalImportString = importString.substr(2, importString.length - 3);
    depsFiles.internal.add(_internalImportString);
  });
}

/* should return a list of dependencies from give file to:
- external modules (3rd party)
- internal TS files
- html and sass files (from Component Metadata)
*/
async function getTSFileDependencies(file: BazelinFile, _args: Args) {
  const AST: SourceFile = ts.createSourceFile(file.path, readFileSync(file.path).toString(), ts.ScriptTarget.Latest, true);
  const projectDependencies: ProjectDependencies = await readProjectDependencies(_args.rootDir);
  const depsFiles: TsFilesDeps = {
    filePath: file.path,
    external: new Set(),
    internal: new Set(),
    html: new Set(),
    styles: new Set()
  };

  AST.statements.forEach((statement: any) => {
    switch (statement.kind) {
      case (SyntaxKind.ImportDeclaration):
        projectDependencies.internal.forEach((alias: string) => {
          if (statement.moduleSpecifier.text.startsWith(alias)) {
            depsFiles.internal.add(statement.moduleSpecifier.text);
            return;
          }
        });

        if (statement.moduleSpecifier.text.startsWith('@')) {
          depsFiles.external.add(statement.moduleSpecifier.text);
          return;
        }

        depsFiles.internal.add(statement.moduleSpecifier.text);
        break;
      case (SyntaxKind.ClassDeclaration):
        statement.decorators.forEach((decorator: any) => {
          /* I assume that we have only one argument in decorator */
          decorator.expression.arguments[0].properties.forEach((property: any) => {
            if (property.name.text === 'templateUrl') {
              depsFiles.html.add(property.initializer.text);
            }

            if (property.name.text === 'styleUrls') {
              depsFiles.styles.add(property.initializer.elements[0].text);
            }
            /* I didn't add case with inline styles: `styles: ['h1 {color: black}']`
             * Can't figure out what to do with this case */
          });
        });
        break;
    }
  });

  console.log('depsFiles', depsFiles);
  return depsFiles;
}

/*EXTRACT FUNC START*/
const _isSassFile = /\.(sass|scss)$/;

async function readFilesDependencies(workspace: Workspace) {
  for (const [, file] of workspace.filePathToFileMap) {
    if (_isSassFile.test(file.name)) {
      const sassFilesDependecies = await getSassFilesDependencies(file);
    }

    if (/\.ts/.test(file.name)) {
      const tsFileDependecies = await getTSFileDependencies(file, args);
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
async function main(_args: Args) {
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
