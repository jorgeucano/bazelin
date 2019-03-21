/* tslint:disable:variable-name */
import {BazelinFile, BazelinWorkspace} from '../../types';
import {BazelRule} from '../bazel-rule.model';
import {filePathToActionLabel, generateInternalDepLabels} from '../rule-utils';

export class NgModuleRule implements BazelRule {
  ruleName = 'ng_module';
  loadFrom = '@npm_angular_bazel//:index.bzl';
  // name Unique name for this rule (required)
  name = '';
  // *.ts files to compile
  srcs: string[] = [];
  // external (npm module dependencies)
  deps: string[] = [];
  // relative paths to html files from controllers or ts controller
  assets?: string[];

  static createFromFile(file: BazelinFile, workspace: BazelinWorkspace): NgModuleRule {
    // todo: ngModule deps should contain
    // 1. deps on other modules
    // 2. deps on npm modules
    // todo: ngModule srs shoold contain relative? paths to .ts files
    // todo: assests should contain
    // 1. relative? paths to html files
    // 2. bazel paths to sass files

    const deps = generateInternalDepLabels(file, workspace);
    const _obj = new NgModuleRule({
      name: filePathToActionLabel(file.path),
      srcs: [],
      assets: [],
      deps
    });
    return _obj;
  }

  // add html dependencies from controller
  addHtml(): void {
  }

  // add css dependencies from controller
  addCss(): void {
  }

  constructor(obj: Partial<NgModuleRule>) {
    Object.assign(this, obj);
  }

  generate(): string {
    const _result = [
      `ng_module(
    name = "${this.name}",
    srcs = [${this.srcs.map(src => `"${src}"`).join(',')}],`];
    if (this.deps.length) {
      const _deps = this.deps.map(dep => `"${dep}"`).join(',');
      _result.push(`    deps = ["${_deps}"],`);
    }
    if (this.assets) {
      const _assets = this.assets.map(asses => `"${asses}"`).join(',');
      _result.push(`    assets = [${_assets}]`);
    }
    _result.push(`)`);
    return _result.join('\n');
  }
}
