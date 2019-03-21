import { BazelRule } from '../bazel-rule.model';

export class TsDevserverRule implements BazelRule {
  ruleName = 'ts_devserver';
  loadFrom = '@build_bazel_rules_nodejs//:defs.bzl';

  // * Required parameter for this rule
  name: string;

  // Port for serve application
  port: number = 4200;

  // * Additional root paths to serve static_files from. Paths should include the workspace name such as [\"__main__/resources\"]
  //TODO
  // example: additional_root_paths = [
  // "npm/node_modules/zone.js/dist",
  // "npm/node_modules/@angular/material/prebuilt-themes", (if we use Angular Material)
  // "npm/node_modules/@ngrx/store/bundles",
  // "npm/node_modules/tslib"
  // ]
  additionalRootPaths: string[] = [];

  // Here could be images, "@npm//node_modules/@ngrx/store:bundles/store.umd.min.js",
  data: string[] = [];

  // Start from the development version of the main etc. path/to/main.dev
  entryModule: string;

  // All static files that need for run devserver (
  // "@npm//node_modules/zone.js:dist/zone.min.js",
  // "@npm//node_modules/tslib:tslib.js",
  // "index.html" ,
  // "//src/styles:main.css",
  // "@npm//node_modules/@angular/material:prebuilt-themes/deeppurple-amber.css",)
  staticFiles: string[] = [];

  // These scripts will be included in the JS bundle after require.js
  // They should have only named UMD modules, or require.js will throw.
  // todo example: script = [":require.config.js",":module-id.js","@npm//node_modules/tslib:tslib.js"] if use Angular Material we need to create module-id.js file with `var module = {id: ''};`
  scripts: string[] = [];

  // Targets which produce files that should be included in the package, (such as rollup_bundle) TODO example: deps = [":my_application"] or deps = ["//src"]
  deps: string[] = [];

  generate(): string {
    return [
      `ts_devserver(`,
      `name = "${this.name}",`,
      `port = "${this.port}"`,
      `additional_root_paths =[`,
      this.additionalRootPaths.map(rootPaths => `"${rootPaths}"`).join(','),
      `],`,
      !this.data.length ? '' :
        `data = [`,
      this.data.map(file => `"${file}"`).join(','),
      `],`,
      `entry_module = "${this.entryModule}"`,
      !this.scripts.length ? '' :
        `scripts = [`,
      this.scripts.map(script => `"${script}"`).join(','),
      `],`,
      !this.staticFiles.length ? '' :
      `static_files = [`,
      this.staticFiles.map(statFile => `"${statFile}"`).join(','),
      `],`,
      !this.deps.length ? '' :
        `deps = [`,
      this.deps.map(dep => `"${dep}"`).join(','),
      `],`,
      `)`
    ].join('\n');
  }
}
