workspace(name = "bazelin")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

ANGULAR_VERSION = "7.1.3"
http_archive(
    name = "angular",
    url = "https://github.com/angular/angular/archive/%s.zip" % ANGULAR_VERSION,
    strip_prefix = "angular-%s" % ANGULAR_VERSION,
)

# RxJS
RXJS_VERSION = "6.3.3"
http_archive(
    name = "rxjs",
    url = "https://registry.yarnpkg.com/rxjs/-/rxjs-%s.tgz" % RXJS_VERSION,
    strip_prefix = "package/src",
)

# Angular material
# NOTE: using a `7.1.1-compat-ng-7.1.3` branch of material2 on a fork here
# since Angular and rules_typescript version under Bazel checking is too strict
# at the moment.
# https://github.com/gregmagolan/material2/commit/e2090864cddf926445eefd39c7e90eada107013d
# TODO(gregmagolan): update the next release of material that is compatible with
#   Angular 7.1.3 under Bazel
http_archive(
    name = "angular_material",
    sha256 = "75bec457885ddf084219a9da152ff79831d84909bb036552141ca3aadee64a04",
    strip_prefix = "material2-7.1.1-compat-ng-7.1.3",
    url = "https://github.com/gregmagolan/material2/archive/7.1.1-compat-ng-7.1.3.zip",
)

http_archive(
    name = "io_bazel_rules_sass",
    # Make sure to check for the latest version when you install
    url = "https://github.com/bazelbuild/rules_sass/archive/1.17.2.zip",
    strip_prefix = "rules_sass-1.17.2",
    sha256 = "e5316ee8a09d1cbb732d3938b400836bf94dba91a27476e9e27706c4c0edae1f",
)

load("@angular//packages/bazel:package.bzl", "rules_angular_dependencies")
rules_angular_dependencies()

load("@build_bazel_rules_typescript//:package.bzl", "rules_typescript_dependencies")
rules_typescript_dependencies()
# build_bazel_rules_nodejs is loaded transitively through rules_typescript_dependencies.

load("@build_bazel_rules_nodejs//:package.bzl", "rules_nodejs_dependencies")
rules_nodejs_dependencies()

load("@build_bazel_rules_nodejs//:defs.bzl", "check_bazel_version", "node_repositories", "npm_install")
# 0.18.0 is needed for .bazelignore
check_bazel_version("0.18.0")
node_repositories()
npm_install(
    name = "npm",
    package_json = "//:package.json",
    package_lock_json = "//:package-lock.json",
)
# Fetch required transitive dependencies. This is an optional step because you
# can always fetch the required NodeJS transitive dependency on your own.
load("@io_bazel_rules_sass//:package.bzl", "rules_sass_dependencies")
rules_sass_dependencies()

# Setup repositories which are needed for the Sass rules.
load("@io_bazel_rules_sass//:defs.bzl", "sass_repositories")
sass_repositories()

load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace", "check_rules_typescript_version")
ts_setup_workspace()

load("@angular//:index.bzl", "ng_setup_workspace")
ng_setup_workspace()

load("@angular_material//:index.bzl", "angular_material_setup_workspace")
angular_material_setup_workspace()

load("@io_bazel_rules_go//go:def.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains()
