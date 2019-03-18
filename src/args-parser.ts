const yargs = require('yargs');

export interface CliArgs {
  srcPath: string;
  rootDir: string;
}

const _args = yargs
  .scriptName('dist/index.js')
  .usage('$0 [args] {path}')
  // .option('in', {describe: 'path to input data file'})
  // .option('out', {describe: 'path to out file'})
  .option('verbose', { describe: 'persist tree of choices' })
  .help()
  .parse();
// .argv as { in: string, out: string };

const srcPath = _args._.length ? _args._[0] : null;
if (srcPath === null) {
  throw new Error('path to src folder is mandatory');
}

// todo: should it be configurable later on?
const rootDir = process.cwd();

export const args: CliArgs = { srcPath, rootDir };

// console.log(`Processing "${args.in}" input, results will be in "${args.out}"`);
