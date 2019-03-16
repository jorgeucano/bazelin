package(default_visibility = ["//visibility:public"])

load("@npm_angular_bazel//:index.bzl", "ng_module")
load("@build_bazel_rules_nodejs//:defs.bzl", "rollup_bundle", "history_server")
load("@npm_bazel_typescript//:index.bzl", "ts_devserver", "ts_library")
load("@io_bazel_rules_sass//:defs.bzl", "multi_sass_binary")

multi_sass_binary(
    name = "styles",
    srcs = glob(["**/*.scss"]),
)

ng_module(
    name = "src",
    srcs = glob(
        include = ["**/*.ts"],
        exclude = [
            "**/*.spec.ts",
            "main.ts",
            "test.ts",
            "initialize_testbed.ts",
        ],
    ),
    assets = glob([
      "**/*.css",
      "**/*.html",
    ]) + ([":styles"] if len(glob(["**/*.scss"])) else []),
    deps = [
        "@npm//@angular/core",
        "@npm//@angular/platform-browser",
        "@npm//@angular/router",
        "@npm//@types",
        "@npm//rxjs",
    ],
)

rollup_bundle(
    name = "bundle",
    entry_point = "src/testdata/ng-module/main.prod",
    deps = [
        "//src/testdata/ng-module:src",
        "@npm//@angular/router",
        "@npm//rxjs",
    ],
)
