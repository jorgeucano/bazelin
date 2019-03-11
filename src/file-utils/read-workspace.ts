import { readdir, stat } from 'fs-extra';
import { join } from 'path';
import { BazelinFile, BazelinFolder, Workspace } from '../bin/bazelin-cli';

export async function readWorkSpace(workspace: Workspace): Promise<Workspace> {
  workspace.srcFolder =  await readFolder(workspace, workspace.srcFolder);

  return workspace;
}

async function readFolder(workspace: Workspace, dir: BazelinFolder): Promise<BazelinFolder> {
  const absDirPath = join(workspace.rootDir, dir.path);
  const nodes = await readdir(absDirPath);
  while (nodes.length) {
    const node = nodes.shift();
    if (!node) {
      continue;
    }
    const _newPath = join(absDirPath, node);
    const stats = await stat(_newPath);
    if (stats.isDirectory()) {
      const _newDirectory: BazelinFolder = await readFolder(workspace, {
        path: join(dir.path, node),
        folders: new Set(),
        files: new Set()
      });

      dir.folders.add(_newDirectory);
      workspace.allFolders.add(_newDirectory);
    } else {
      const _fileObj: BazelinFile = {
        name: node,
        path: _newPath,
        folder: dir
      };
      dir.files.add(_fileObj);
      workspace.allFiles.add(_fileObj);
    }
  }

  return dir;
}
