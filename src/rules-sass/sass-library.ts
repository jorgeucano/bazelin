export interface BazelRule {
  // Required load statements, for example
  // load("@io_bazel_rules_sass//:defs.bzl", "sass_binary")
  load: Map<string, string>;
  ruleName: string;

  generate(): string;
}

export class SassLibraryRule implements BazelRule {
  ruleName = 'sass_library';
  load = new Map([['@io_bazel_rules_sass//:defs.bzl', this.ruleName]]);
  // name	Unique name for this rule (required)
  name: string;
  // src	Sass files included in this library. Each file should start with an underscore
  src: string[] = [];
  // deps	Dependencies for the src. Each dependency is a sass_library
  deps: string[] = [];

  generate(): string {
    return [
      `sass_binary(`,
      `name = "${this.name}",`,
      `src = "${this.src}",`,
      !this.deps.length ? '' :
        `deps = [`,
      this.deps.map(dep => `"${dep}"`).join(','),
      `],`,
      `)`
    ].join('\n');
  }
}
