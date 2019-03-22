import { basename } from 'path';
import { BazelinFile, BazelinWorkspace } from '../../types';
import { BazelRule } from '../bazel-rule.model';
import {
  filePathToActionLabel,
  generateInternalDepLabels
} from '../rule-utils';

/* convert sass to lib to be consumed by sass binary */
export class SassLibraryRule implements BazelRule {
  ruleName = 'sass_library';
  loadFrom = '@io_bazel_rules_sass//:defs.bzl';
  // name Unique name for this rule (required)
  name = '';
  // src Sass files included in this library.
  srcs: string[] = [];
  // deps Dependencies for the src. Each dependency is a sass_library
  deps: string[] = [];

  constructor(obj: SassLibraryRule) {
    Object.assign(this, obj);
  }

  static createFromFile(file: BazelinFile, workspace: BazelinWorkspace): SassLibraryRule {
    const fileName = basename(file.path);
    // todo: convert internal/external deps
    const deps = generateInternalDepLabels(file, workspace.rootDir);

    const _obj = new SassLibraryRule({
      name: filePathToActionLabel(file.path),
      // convert abs path to bazel path to dependency
      // so "/usr/vasya/project/assets/_some.sass
      // -> "//assets:_some
      // where "/usr/vasya/project/WORKSPACE"
      // src =
      srcs: [fileName],
      deps
    } as any);
    return _obj;
  }

  generate(): string {
    const _result = [
      `sass_library(
  name = "${this.name}",
  srcs = [${this.srcs.map(src => `"${src}"`).join(',')}],`
    ];
    if (this.deps.length) {
      const _deps = this.deps.map(dep => `"${dep}"`).join(',');
      _result.push(`  deps = [${_deps}],`);
    }
    _result.push(`)`);
    return _result.join('\n');
  }
}
