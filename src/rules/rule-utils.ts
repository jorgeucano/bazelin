import { basename, dirname, relative } from 'path';
import { BazelinFile, BazelinWorkspace } from '../types';

export function isSameFolder(path1: string, path2: string): boolean {
  return dirname(path1) === dirname(path2);
}

export function filePathToActionLabel(filePath: string): string {
  return basename(filePath).replace(/\./g, '_');
}

function _filePathToActionAbsName(filePath: string, workspace: BazelinWorkspace): string {
  return `//${relative(workspace.rootDir, dirname(filePath))}:${filePathToActionLabel(filePath)}`;
}

function _intDepToActioName(file: BazelinFile, pathToDep: string, workspace: BazelinWorkspace): string {
  if (isSameFolder(pathToDep, file.path)) {
    return `:${filePathToActionLabel(pathToDep)}`;
  }
  return _filePathToActionAbsName(pathToDep, workspace);
}

export function generateInternalDepLabels(file: BazelinFile, workspace: BazelinWorkspace): string[] {
  const deps: string[] = [];
  if (file.deps) {
    for (const pathToDep of file.deps.internal) {
      deps.push(_intDepToActioName(file, pathToDep, workspace));
    }
  }
  return deps;
}
