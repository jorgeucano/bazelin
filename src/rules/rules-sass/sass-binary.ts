/* tslint:disable:variable-name */
import { basename, dirname, relative } from 'path';
import { BazelinFile, BazelinWorkspace } from '../../types';
import { BazelRule } from '../bazel-rule.model';
import { filePathToActionLabel, generateInternalDepLabels } from '../rule-utils';


/* converts to css and consumed by ng */
export class SassBinaryRule implements BazelRule {
  readonly ruleName = 'sass_binary';
  readonly loadFrom = '@io_bazel_rules_sass//:defs.bzl';
  // name Unique name for this rule (required)
  name = '';
  // src Sass files included in this binary.
  src = '';
  // deps Dependencies for the src. Each dependency is a sass_library
  deps: string[] = [];
  // Additional directories to search when resolving imports
  include_paths: string[] = [];
  // Output style for the generated CSS. Can be only expanded or compressed
  output_style: string | undefined;
  // Whether to generate sourcemaps for the generated CSS. Defaults to True. First letter should be in Uppercase
  sourcemap: boolean | undefined;



  static createFromFile(file: BazelinFile, workspace: BazelinWorkspace): SassBinaryRule {
    const fileName = basename(file.path);
    // todo: convert internal/external deps
    const deps = generateInternalDepLabels(file, workspace);

    const _obj = new SassBinaryRule({
      name: filePathToActionLabel(file.path),
      // convert abs path to bazel path to dependency
      // so "/usr/vasya/project/assets/_some.sass
      // -> "//assets:_some
      // where "/usr/vasya/project/WORKSPACE"
      // src =
      src: fileName,
      deps
    } as any);
    return _obj;
  }

  constructor(obj: SassBinaryRule) {
    Object.assign(this, obj);
  }

  generate(): string {
    const _result = [
      `sass_binary(
    name = "${this.name}",
    src = "${this.src}",`];
    if (this.deps.length) {
      const _deps = this.deps.map(dep => `"${dep}"`).join(',');
      _result.push(`  deps = [${_deps}],`);
    }
    if (this.include_paths.length) {
      const _includePaths = this.include_paths.map(path => `"${path}"`).join(',');
      _result.push(`  include_paths = [${_includePaths}]`);
    }
    // !this.output_style ? '' : `output_style = "${this.output_style}",`,
    //   !this.sourcemap ? '' : `sourcemap = "${this.sourcemap}",`,
    _result.push(`)`);
    return _result.join('\n');
  }
}
