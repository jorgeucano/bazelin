import { BazelRule } from '../bazel-rule.model';

export class NpmPackageRule implements BazelRule {
  ruleName = 'npm_package';
  loadFrom = '@build_bazel_rules_nodejs//:defs.bzl';

  // * Required parameter for this rule
  name: string;

  // Targets which produce files that should be included in the package, (such as rollup_bundle) TODO example: deps = [":my_lib"]
  deps: string[] = [];

  // Files inside this directory which are simply copied into the package. TODO etc. (srcs = ["//:package.json"])
  srcs: string[] = [];

  // If set this value is replaced with the version stamp data. See the section on stamping in the README.
  replaceWithVersion: string = '0.0.0-PLACEHOLDER'; // TODO default is '0.0.0-PLACEHOLDER'

  // Key-value pairs which are replaced in all the files while building the package.
  replacements: string;

  generate(): string {
    return [
      `npm_package(`,
      `name = "${this.name}",`,
      !this.srcs.length ? '' :
        `srcs = [`,
      this.srcs.map(srcs => `"${srcs}"`).join(','),
      `],`,
      !this.deps.length ? '' :
        `deps = [`,
      this.deps.map(dep => `"${dep}"`).join(','),
      `],`,
      `replace_with_version = "${this.replaceWithVersion}"`,
      `replacement = {"//internal/": "${this.replacements}"},`,
      `)`
    ].join('\n');
  }
}
