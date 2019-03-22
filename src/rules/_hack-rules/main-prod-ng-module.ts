/* tslint:disable:variable-name */
import {dirname, relative} from 'path';
import {_isHtml, _isMainProd, _isSassFile, _isTsFile} from '../../file-utils/file-ext-patterns';
import {BazelinFile, BazelinWorkspace} from '../../types';
import {BazelRule} from '../bazel-rule.model';
import {_intDepToActionName, filePathToActionLabel, isSameFolder} from '../rule-utils';
import {isNgModule} from '../rules-angular/ng-utils';

export class MainProdNgModule implements BazelRule {
  ruleName = 'ng_module';
  loadFrom = '@npm_angular_bazel//:index.bzl';
  // name Unique name for this rule (required)
  name = '';
  // *.ts files to compile
  srcs: string[] = [];
  // external (npm module dependencies)
  deps: string[] = [];
  // relative paths to html files from controllers or ts controller
  assets: string[];

  static createFromFile(file: BazelinFile, workspace: BazelinWorkspace): MainProdNgModule {
    return new MainProdNgModule(file, workspace);
  }

  constructor(private file: BazelinFile, private workspace: BazelinWorkspace) {
  }

  generate(): string {
    // ngModule deps + [] of ts file to process
    // html -> assets
    // scss -> sass_bin -> assets
    // ts -> srcs
    // external -> @npm//module -> deps

    this.assets = [];
    this.deps = [];

    const _result = [
      `ng_module(
    name = "${dirname(this.file.folder.path)}",
    srcs = glob(
        include = ["*.ts"],
        exclude = [
            "**/*.spec.ts",
            "main.ts",
            "test.ts",
            "initialize_testbed.ts",
        ],
        ),`];

    if (this.assets.length) {
      const _assets = this.assets.map(asses => `"${asses}"`).join(',');
      _result.push(`    assets = [${_assets}],`);
    }

    if (this.deps.length) {
      const _deps = this.deps.map(dep => `"${dep}"`).join(',');
      _result.push(`    deps = [${_deps}],`);
    }

    _result.push(`)`);
    return _result.join('\n');
  }
}
