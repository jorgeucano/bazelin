import { BazelinFile } from '../../types';

const _isNgModuleMark = 'isNgModule';

export function isNgModule(file?: BazelinFile): boolean {
  if (!file) {
    return false;
  }
  return !!file.meta.get(_isNgModuleMark);
}

export function markAsNgModule(file: BazelinFile): void {
  file.meta.set(_isNgModuleMark, true);
}
