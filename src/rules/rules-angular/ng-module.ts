/* tslint:disable:variable-name */
import {relative} from 'path';
import {_isHtml, _isMainProd, _isSassFile, _isTsFile} from '../../file-utils/file-ext-patterns';
import {BazelinFile, BazelinWorkspace} from '../../types';
import {BazelRule} from '../bazel-rule.model';
import {_intDepToActionName, filePathToActionLabel} from '../rule-utils';

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
  assets: string[];

  private _ngDeps: BazelinFile[] = [];

  static createFromFile(file: BazelinFile, workspace: BazelinWorkspace): NgModuleRule {
    // todo: ngModule deps should contain
    // 1. deps on other modules
    // 2. deps on npm modules
    // todo: ngModule srs shoold contain relative? paths to .ts files
    // todo: assests should contain
    // 1. relative? paths to html files
    // 2. bazel paths to sass files

    return new NgModuleRule(file, workspace);
  }

  addDeps(file: BazelinFile): void {
    this._ngDeps.push(file);
  }

  // add html dependencies from controller
  addHtml(filePath: string): void {
    this.assets.push(filePath);
  }

  // add css dependencies from controller
  addCss(filePath: string): void {
    this.assets.push(filePath);
  }

  constructor(private file: BazelinFile, private workspace: BazelinWorkspace) {
    this.name = filePathToActionLabel(this.file.path);
  }

  generate(): string {
    // ngModule deps + [] of ts file to process
    // html -> assets
    // scss -> sass_bin -> assets
    // ts -> srcs
    // external -> @npm//module -> deps
    const _internal = Array.from(this.file.deps.internal)
      .concat(...this._ngDeps
        .map((file: BazelinFile) => Array.from(file.deps.internal)));
    _internal.push(this.file.path);

    const _externalSet = new Set(['@types', '@angular/platform-browser']);
    Array.from(this.file.deps.external)
      .forEach(dep => _externalSet.add(dep));
    this._ngDeps.forEach(file => file.deps
      .external.forEach(dep => _externalSet.add(dep)));
    const _external = Array.from(_externalSet)
      .map(path => `@npm//${path}`);


    const _scss = _internal
      .filter((filePath: string) => _isSassFile.test(filePath))
      // .map(_path => relative(this.file.folder.path, _path))
      .map(_path => _intDepToActionName(this.file, _path, this.workspace));
    const _html = _internal
      .filter(_path => _isHtml.test(_path))
      .map(_path => relative(this.file.folder.path, _path));
    const _ts = _internal
      .filter(_path => _isTsFile.test(_path))
      .map(_path => relative(this.file.folder.path, _path));

    // if required by main.prod add it to _internal
    for (const _reqBy of this.file.requiredBy) {
      if (_isMainProd.test(_reqBy.path)) {
        _ts.push(relative(this.file.folder.path, _reqBy.path));
      }
    }

    this.srcs = [..._ts];
    this.assets = [..._html, ..._scss];
    this.deps = [..._external];

    const _result = [
      `ng_module(
    name = "${this.name}",
    srcs = [${this.srcs.map(src => `"${src}"`).join(',')}],`];

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
