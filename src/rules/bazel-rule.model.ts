export interface BazelRule {
  // Required load statements, for example
  // load("@io_bazel_rules_sass//:defs.bzl", "sass_binary")
  ruleName: string;
  loadFrom: string;

  generate(): string;
}
