import { readFile } from 'fs-extra';
import { SyntaxKind } from 'typescript';
import * as ts from 'typescript';
import { SourceFile } from 'typescript';
import { CliArgs } from '../args-parser';
import { ProjectDependencies, readProjectDependencies } from '../file-utils/read-dependencies';

export interface TsFilesDeps extends BazelinFileDeps {
  filePath: string;
  html: Set<string>;
  styles: Set<string>;
}

/* should return a list of dependencies from give file to:
- external modules (3rd party)
- internal TS files
- html and sass files (from Component Metadata)
*/
import { BazelinFile, BazelinFileDeps } from '../types';

export async function getTSFileDependencies(file: BazelinFile, _args: CliArgs) {
  const fileContent = await readFile(file.path, 'utf8');
  const AST: SourceFile = ts.createSourceFile(file.path, fileContent, ts.ScriptTarget.Latest, true);
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

  console.log('depsFiles', depsFiles);
  return depsFiles;
}
