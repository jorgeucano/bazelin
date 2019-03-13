/* tslint:disable:variable-name */
import { BazelRule } from '../bazel-rule.model';

export class SassBinaryRule implements BazelRule {
  ruleName = 'sass_binary';
  load = new Map([['@io_bazel_rules_sass//:defs.bzl', this.ruleName]]);
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

  generate(): string {
    return [
      `sass_binary(`,
        `name = "${ this.name }",`,
        `src = "${ this.src }",`,
        !this.deps.length ? '' :
          `deps = [`,
            this.deps.map(dep => `"${ dep }"`).join(','),
          `],`,
        !this.include_paths.length ? '' :
          `include_paths = [`,
            this.include_paths.map(path => `"${ path }"`).join(','),
          `],`,
        !this.output_style ? '' : `output_style = "${ this.output_style }",`,
        !this.sourcemap ? '' : `sourcemap = "${ this.sourcemap }",`,
      `)`
    ].join('\n');
  }
}
