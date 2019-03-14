package(default_visibility = ["//visibility:public"])

load("@io_bazel_rules_sass//sass:sass.bzl", "sass_binary")

# Import our shared colors and fonts so we can generate a CSS file.
sass_binary(
    name = "nested",
    src = "dir/main.scss",
    deps = [
        "//src/testdata/sass-shared:colors",
        "//src/testdata/sass-shared:fonts",
    ],
)
