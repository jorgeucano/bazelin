import { basename, dirname, relative } from 'path';
import { BazelinFile, BazelinWorkspace } from '../types';

export function isSameFolder(path1: string, path2: string): boolean {
  return dirname(path1) === dirname(path2);
}

export function filePathToActionLabel(filePath: string): string {
  return basename(filePath).replace(/\./g, '_');
}

function _filePathToActionAbsName(filePath: string, rootDir: string): string {
  return `//${relative(rootDir, dirname(filePath))}:${filePathToActionLabel(filePath)}`;
}

export function _intDepToActionName(file: BazelinFile, pathToDep: string, rootDir: string): string {
  if (isSameFolder(pathToDep, file.path)) {
    return `:${filePathToActionLabel(pathToDep)}`;
  }
  return _filePathToActionAbsName(pathToDep, rootDir);
}

export function generateInternalDepLabels(file: BazelinFile, rootDir: string): string[] {
  const deps: string[] = [];
  if (file.deps) {
    for (const pathToDep of file.deps.internal) {
      deps.push(_intDepToActionName(file, pathToDep, rootDir));
    }
  }
  return deps;
}
