export interface BazelRule {
  // Required load statements, for example
  // load("@io_bazel_rules_sass//:defs.bzl", "sass_binary")
  load: Map<string, string>;
  ruleName: string;

  generate(): string;
}
