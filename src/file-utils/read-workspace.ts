import {readdir, stat} from 'fs-extra';
import {join} from 'path';
import {BazelRule} from '../rules/bazel-rule.model';
import {BazelinFile, BazelinFolder, BazelinWorkspace} from '../types';
import {_ignoreFiles} from './file-ext-patterns';

export async function readWorkSpace(workspace: BazelinWorkspace): Promise<BazelinWorkspace> {
  workspace.srcFolder = await readFolder(workspace, workspace.srcFolder);

  return workspace;
}

async function readFolder(workspace: BazelinWorkspace, dir: BazelinFolder): Promise<BazelinFolder> {
  const absDirPath = join(workspace.rootDir, dir.path);
  const nodes = await readdir(absDirPath);
  while (nodes.length) {
    const node = nodes.shift();
    if (!node) {
      continue;
    }
    if (_ignoreFiles.test(node)) {
      continue;
    }

    const _newPath = join(absDirPath, node);
    const stats = await stat(_newPath);
    if (stats.isDirectory()) {
      const _newDirectory: BazelinFolder = await readFolder(workspace, {
        path: join(dir.path, node),
        folders: new Set(),
        files: new Set(),
        rules: new Set<BazelRule>(),
        buildFile: ''
      });

      dir.folders.add(_newDirectory);
      workspace.folderPathToFolderMap.set(_newDirectory.path, _newDirectory);
    } else {
      const _fileObj: BazelinFile = {
        name: node,
        path: _newPath,
        folder: dir,
        requiredBy: new Set<BazelinFile>(),
        isProcessed: false,
        meta: new Map(),
        deps: {external: new Set(), internal: new Set()},
        rules: new Set()
      };
      dir.files.add(_fileObj);
      workspace.filePathToFileMap.set(_fileObj.path, _fileObj);
    }
  }

  return dir;
}
