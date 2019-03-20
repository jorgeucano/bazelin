import { readFile } from 'fs-extra';
import { dirname } from 'path';
import { BazelinFile, BazelinFileDeps } from '../types';

const gonzales = require('gonzales-pe');
const resolve = require('@csstools/sass-import-resolve');

/* should return a list of internal and external dependencies
 * from given file to other sass files and assets (like fonts) */
export async function getSassFilesDependencies(file: BazelinFile): Promise<BazelinFileDeps> {
  const _sharedCache = {};
  const fileDeps = await readFile(file.path, 'utf8');
  const parsed = gonzales.parse(fileDeps, { syntax: 'scss' });
  const depsFiles: BazelinFileDeps = {
    external: new Set(),
    internal: new Set()
  };

  const _toResolve: string[] = [];

  parsed.forEach('atrule', async (node: any, index: number) => {
    const atkeyword = node.first('atkeyword').first('ident');

    if (atkeyword.content !== 'import') {
      return;
    }

    const importNode = node.first('string');
    if (!importNode) {
      // todo: add support for @import url()
      // todo: like @import url("~@ionic/angular/css/flex-utils.css");
      // console.warn(`url import in sass file: ${file.path}`);
      return;
    }
    const importString = importNode.content;

    // "~bootstrap/sass" -> "bootstrap/sass"
    if (importString[1] === '~') {
      const _importString = importString.substr(2, importString.length - 3);
      depsFiles.external.add(_importString);
      return;
    }

    // "../../bootstrap/sass" -> "bootstrap/sass"
    const nodeModules = 'node_modules/';
    if (importString.indexOf(nodeModules) !== -1) {
      const offset = importString.indexOf(nodeModules) + nodeModules.length;
      const _importString = importString.substr(offset, importString.length - offset - 1);
      depsFiles.external.add(_importString);
      return;
    }

    const _internalImportString = importString.substr(1, importString.length - 2);
    _toResolve.push(_internalImportString);

  });

  for (const _internalImportString of _toResolve) {
    try {

      // resolve relative paths to absolute
      const _resolvedImport = await resolve(_internalImportString, {
        readFile: false,
        cwd: dirname(file.path),
        cache: _sharedCache
      });
      depsFiles.internal.add(_resolvedImport.file);
    } catch (e) {
      console.error(`Can't resolve "${_internalImportString}" from ${file.path}`);
      throw e;
    }
  }
  return depsFiles;
}
