import { BazelRule } from '../rules-sass/sass-library';

export class RollupBundleRule implements BazelRule {
  ruleName = 'rollup_bundle';
  load = new Map([['@build_bazel_rules_nodejs//:defs.bzl', this.ruleName]]);

  // * Required parameter for this rule
  name: string;

  // List of labels, other rules that produce JavaScript outputs TODO (etc. 'ts_library')
  deps: string[] = [];

  // * Required parameter, the starting point of the application. Should be relative to the workspace root TODO ( etc. src/main.prod )
  entryPoint: string;

  // TODO
  //  # These Angular routes may be lazy-loaded at runtime.
  //  # So we tell Rollup that it can put them in separate JS chunks
  //  # (code-splitting) for faster application startup.
  //  # In the future, we could automatically gather these from statically
  //  # analyzing the Angular sources.
  //  additional_entry_points it's Optional param. Need to discuss.
  additionalEntryPoints: string[] = [];

  generate(): string {
    return [
      `rollup_bundle(`,
      `name = "${this.name}",`,
      !this.additionalEntryPoints.length ? '' :
      `additional_entry_points = [`,
      this.additionalEntryPoints.map(entryPoint => `"${entryPoint}"`).join(','),
      `],`,
      `entry_point = ${this.entryPoint},`,
      !this.deps.length ? '' :
        `deps = [`,
      this.deps.map(dep => `"${dep}"`).join(','),
      `],`,
      `)`
    ].join('\n');
  }
}
