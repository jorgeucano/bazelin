/* tslint:disable:variable-name */
import { BazelinFile, BazelinWorkspace } from '../../types';
import { BazelRule } from '../bazel-rule.model';

export class NgModuleRule implements BazelRule {
  ruleName = 'ng_module';
  loadFrom = '@npm_angular_bazel//:index.bzl';
  // name Unique name for this rule (required)
  name = '';
  // src Sass files included in this binary.
  srcs: string[] = [];
  // deps Dependencies for the src. Each dependency is a sass_library
  deps: string[] = [];
  // Run the Angular ngtsc compiler under ts_library; Default is False
  assets?: string[];
  // Sets a different ngc compiler binary to use for this library.
  compiler?: string;
  // The npm packages which should be available during the compile; Default is @npm//typescript:typescript__typings
  // This attribute is DEPRECATED
  node_modules?: string;
  // tsconfig.json file containing settings for TypeScript compilation. Note that
  // some properties in the tsconfig are governed by Bazel and will be overridden, such as target and module
  tsconfig?: string;

  static createFromFile(file: BazelinFile, workspace: BazelinWorkspace): NgModuleRule {
    const _obj: any = {

    };
    return _obj;
  }

  generate(): string {
    return [
      `sass_binary(`,
      `name = "${this.name}",`,
      `srcs = "${this.srcs.map(src => `"${src}"`).join(',')}",`,
      !this.deps.length ? '' :
        `deps = [`,
      this.deps.map(dep => `"${dep}"`).join(','),
      `],`,
      !this.assets ? '' : `assets = "${this.assets}",`,
      !this.compiler ? '' : `compiler = "${this.compiler}",`,
      !this.node_modules ? '' : `node_modules = "${this.node_modules}",`,
      !this.tsconfig ? '' : `tsconfig = "${this.tsconfig}",`,
      `)`
    ].join('\n');
  }
}
