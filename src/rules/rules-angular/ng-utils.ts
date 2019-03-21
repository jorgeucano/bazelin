import { BazelinFile } from '../../types';

const _isNgModuleMark = 'isNgModule';

export function isNgModule(file: BazelinFile): boolean {
  return !!file.meta.get(_isNgModuleMark);
}

export function markAsNgModule(file: BazelinFile): void {
  file.meta.set(_isNgModuleMark, true);
}
