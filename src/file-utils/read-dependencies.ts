import { readFileSync } from 'fs';
import { join } from 'path';
import { readJson } from 'fs-extra';
import { readConfigFile } from 'typescript';
// todo: accept names as parameters
const TSCONFIG = 'tsconfig.json';
const PACKAGEJSON = 'package.json';

export interface ProjectDependencies {
  internal: string[];
  external: string[];
}

async function _readTSConfigPaths(filePath: string): Promise<string[]> {
  try {
    const tsconfig = readConfigFile(filePath, str => readFileSync(str, 'utf8'));
    return Object.keys(tsconfig.config.compilerOptions.paths);
  } catch {
    return [];
  }
}

async function _readPackageDependecies(filePath: string): Promise<string[]> {
  try {
    const packageJson = await readJson(filePath);
    const deps = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
    const devDeps = packageJson.devDependencies ? Object.keys(packageJson.devDependencies) : [];

    return [...deps, ...devDeps];
  } catch {
    return [];
  }
}

export async function readProjectDependencies(dir: string): Promise<ProjectDependencies> {
  const internal = await _readTSConfigPaths(join(dir, TSCONFIG));
  const external = await _readPackageDependecies(join(dir, PACKAGEJSON));

  return {internal, external};
}
