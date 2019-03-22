/* tslint:disable:variable-name */
import {relative} from 'path';
import {__param} from 'tslib';
import {_isHtml, _isMainProd, _isSassFile, _isTsFile} from '../../file-utils/file-ext-patterns';
import {BazelinFile, BazelinWorkspace} from '../../types';
import {BazelRule} from '../bazel-rule.model';
import {_intDepToActionName, filePathToActionLabel, isSameFolder} from '../rule-utils';
import {isNgModule} from './ng-utils';

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
  private _rootDir: string;

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

  addExtDeps(extDeps: Set<string>): void {
    for (const dep of extDeps) {
      this.file.deps.external.add(dep);
    }
  }

  setRootDir(rootDir: string): void {
    this._rootDir = rootDir;
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
    const _rootDir = this._rootDir || this.file.folder.path;

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


    // sass assets
    const _scss = _internal
      .filter((filePath: string) => _isSassFile.test(filePath))
      // .map(_path => relative(this.file.folder.path, _path))
      .map(_path => _intDepToActionName(this.file, _path, this.workspace.rootDir));

    // html assets
    const _html = _internal
      .filter(_path => _isHtml.test(_path))
      .map(_path => relative(_rootDir, _path));

    // dependencies to local ts files
    const _ts = _internal
      .filter(_path => _isTsFile.test(_path))
      .filter(_path => this.file.path === _path || !isNgModule(this.workspace.filePathToFileMap.get(_path)))
      .map(_path => relative(_rootDir, _path));

    // dependencies to other ngModules
    const _tsExt = _internal
      .filter(_path => _isTsFile.test(_path))
      .filter(_path => this.file.path !== _path && isNgModule(this.workspace.filePathToFileMap.get(_path)))
      .map(_path => _intDepToActionName(this.file, _path, this.workspace.rootDir));

    this.srcs = [..._ts];
    this.assets = [..._html, ..._scss];
    this.deps = [..._tsExt, ..._external];

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
