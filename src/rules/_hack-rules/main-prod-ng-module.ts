/* tslint:disable:variable-name */
import {basename, dirname, relative} from 'path';
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

    const _internal = Array.from(this.file.deps.internal);

    this.file.deps.external.add('@types');
    const _external = Array.from(this.file.deps.external)
      .map(path => `@npm//${path}`);

    // dependencies to entry sass files
    const _scss = _internal
      .filter((filePath: string) => _isSassFile.test(filePath))
      // .map(_path => relative(this.file.folder.path, _path))
      .map(_path => _intDepToActionName(this.file, _path, this.workspace.rootDir));

    // dependencies to entry ts files
    const _ts = _internal
      .filter(_path => _isTsFile.test(_path))
      .map(_path => _intDepToActionName(this.file, _path, this.workspace.rootDir));

    // check is main.prod.ts in the same folder as AppModule
    let _includeAll = true;
    for (const dep of this.file.deps.internal) {
      const _target = this.workspace.filePathToFileMap.get(dep);
      if (!_target) {
        continue;
      }

      if (_target.requiredBy.has(this.file)) {
        _includeAll = !isSameFolder(_target.path, this.file.path);
        break;
      }
    }

    this.assets = [..._scss];
    this.deps = [..._ts, ..._external];
    const _include = _includeAll ? '*.ts' : 'main.prod.ts';

    const _result = [
      `ng_module(
    name = "${basename(this.file.folder.path)}",
    srcs = glob(
        include = ["${_include}"],
        exclude = [
            "**/*.spec.ts",
            "main.ts",
            "test.ts",
            "initialize_testbed.ts",
        ],
        ),`];

    // todo:
    if (this.assets.length) {
      const _assets = this.assets.map(asses => `\n# "${asses}"`).join(',');
      _result.push(`    assets = [\n${_assets} \n],`);
    }

    if (this.deps.length) {
      const _deps = this.deps.map(dep => `"${dep}"`).join(',');
      _result.push(`    deps = [${_deps}],`);
    }

    _result.push(`)`);
    return _result.join('\n');
  }
}
