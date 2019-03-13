import { BazelRule } from '../bazel-rule.model';

export class SassLibraryRule implements BazelRule {
  ruleName = 'sass_library';
  load = new Map([['@io_bazel_rules_sass//:defs.bzl', this.ruleName]]);
  // name Unique name for this rule (required)
  name = '';
  // src Sass files included in this library.
  srcs: string[] = [];
  // deps Dependencies for the src. Each dependency is a sass_library
  deps: string[] = [];

  generate(): string {
    return [
      `sass_library(`,
        `name = "${ this.name }",`,
        `srcs = "${ this.srcs.map(src => `"${ src }"`).join(',') }",`,
        !this.deps.length ? '' :
          `deps = [`,
            this.deps.map(dep => `"${ dep }"`).join(','),
          `],`,
      `)`
    ].join('\n');
  }
}
