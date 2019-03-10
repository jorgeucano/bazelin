import { readFile, stat, writeFile } from 'fs-extra';
import { join, relative, dirname } from 'path';
import { args } from '../args-parser';
import { readFilesList } from '../read-files-list';

const gonzales = require('gonzales-pe');

// 1. read files
// 2. filter sass/scss only
// 3. replace ~ with relative import from node_modules and save

const NODE_MODULES = 'node_modules';
const _isSassFile = /\.(sass|scss)$/;

async function main(_args: { srcPath: string, rootDir: string }) {
  // get node_modules path and check for existence
  const nodeModules = join(_args.rootDir, NODE_MODULES);
  try {
    const _nodeModulesStats = await stat(nodeModules);
    if (!_nodeModulesStats.isDirectory()) {
      throw new Error(`node_modules folder not found in ${_args.rootDir}`);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }


  // create absolute path to src folder
  const absSrcPath = join(_args.rootDir, _args.srcPath);
  // get files list
  const filesTree = await readFilesList(absSrcPath);
  // filter only sass and scss files
  const scssFiles = filesTree
    .filter(fileName => _isSassFile.test(fileName));

  // for each file
  await scssFiles.forEach(async function _tildasDeath(file) {
    // 1. read content as string
    const css = await readFile(join(absSrcPath, file), 'utf8');
    // 2. parse content to sass ast tree
    const parsed = gonzales.parse(css, { syntax: 'scss' });
    // 3. iterate all sass ast nodes with type `atrule`
    // see https://github.com/tonyganch/gonzales-pe/blob/dev/docs/node-types.md#atrule
    // sass ast forEach api https://github.com/tonyganch/gonzales-pe#parsetreeforeachtype-callback
    const _fullSassFilePath = join(absSrcPath, file);
    const relativePathToModules = relative(dirname(_fullSassFilePath), nodeModules);
    // we should not overwrite pristine files
    let isFileModified = false;

    // if parsing `@import '~core/test.scss';`
    parsed.forEach('atrule', (node: any, index: number) => {
      // atkeyword.content should be `import`
      const atkeyword = node.first('atkeyword').first('ident');
      if (atkeyword.content !== 'import') {
        return;
      }
      // importString.content should be "~core/test.scss" (with quotes)
      const importNode = node.first('string');
      const importString = importNode.content;

      // we are will replace only tilda imports
      if (importString[1] !== '~') {
        return;
      }
      isFileModified = true;
      // cutoff quotas and ~, so it will be "core/test.scss"
      const _importString = importString.substr(2, importString.length - 1);

      importNode.content = [importString[0], join(relativePathToModules, _importString), importString[importString.length]].join('');
    });
    if (isFileModified) {
      console.log(`fixed ${file}`);
      await writeFile(_fullSassFilePath, parsed.toString(), 'utf8');
    }
  });
}

main(args);
