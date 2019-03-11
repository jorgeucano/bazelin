import { readdir, stat } from 'fs-extra';
import { join } from 'path';

export async function readFilesList(dir: string, filelist: string[] = []) {
  const files = await readdir(dir);
  while (files.length) {
    const file = files.shift();
    if (!file) {
      continue;
    }
    const _newPath = join(dir, file);
    const stats = await stat(_newPath);
    if (stats.isDirectory()) {
      const nextFiles = await readdir(_newPath);
      files.push(... nextFiles.map(_file => join(file, _file)));
    } else {
      filelist.push(file);
    }
  }
  return filelist;
}
