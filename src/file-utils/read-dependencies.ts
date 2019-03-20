import { readFileSync } from 'fs';
import { join } from 'path';
import { readJson } from 'fs-extra';
import { readConfigFile } from 'typescript';
import { ProjectDependencies } from '../types';
// todo: accept names as parameters
const TSCONFIG = 'tsconfig.json';
const PACKAGEJSON = 'package.json';


async function _readTSConfigPaths(filePath: string): Promise<{ internal: string[], pathMappings: Array<[string, string[]]> }> {
  let internal: string[] = [];
  let pathMappings: Array<[string, string[]]> = [];
  try {
    const tsconfig = readConfigFile(filePath, str => readFileSync(str, 'utf8'));
    internal = Object.keys(tsconfig.config.compilerOptions.paths);
    pathMappings = Object.entries(tsconfig.config.compilerOptions.paths);
  } catch (e) {
  }
  return { internal, pathMappings };
}

async function _readPackageDependencies(filePath: string): Promise<string[]> {
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
  const { internal, pathMappings } = await _readTSConfigPaths(join(dir, TSCONFIG));
  const external = await _readPackageDependencies(join(dir, PACKAGEJSON));

  return { internal, external, pathMappings };
}
