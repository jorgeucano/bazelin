/* tslint:disable:variable-name */
import { BazelRule } from '../bazel-rule.model';

export class TsLibraryRule implements BazelRule {
  ruleName = 'ts_library';
  loadFrom = '@build_bazel_rules_typescript//:defs.bzl';
  // name Unique name for this rule (required)
  name = '';
  // src Sass files included in this binary.
  srcs: string[] = [];
  // deps Dependencies for the src. Each dependency is a sass_library
  deps: string[] = [];
  // Sets a different TypeScript compiler binary to use for this library. For example,
  // we use the vanilla TypeScript tsc.js for bootstrapping, and Angular compilations can replace this with ngc
  // Default is @npm//@bazel/typescript/bin:tsc_wrapped
  compiler?: string;
  // The npm packages which should be available during the compile; Default is @npm//typescript:typescript__typings
  // This attribute is DEPRECATED
  node_modules?: string;
  // tsconfig.json file containing settings for TypeScript compilation. Note that
  // some properties in the tsconfig are governed by Bazel and will be overridden, such as target and module
  tsconfig?: string;

  generate(): string {
    return [
      `sass_binary(`,
        `name = "${ this.name }",`,
        `srcs = "${ this.srcs.map(src => `"${ src }"`).join(',') }",`,
        !this.deps.length ? '' :
          `deps = [`,
            this.deps.map(dep => `"${ dep }"`).join(','),
          `],`,
        !this.compiler ? '' : `compiler = "${ this.compiler }",`,
        !this.node_modules ? '' : `node_modules = "${ this.node_modules }",`,
        !this.tsconfig ? '' : `tsconfig = "${ this.tsconfig }",`,
      `)`
    ].join('\n');
  }
}
