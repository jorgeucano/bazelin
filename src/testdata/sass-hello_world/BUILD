package(default_visibility = ["//visibility:public"])

load("@io_bazel_rules_sass//:defs.bzl", "sass_binary")

# Import our shared colors and fonts so we can generate a CSS file.
sass_binary(
    name = "hello_world",
    src = "main.scss",
    deps = [
        "//src/testdata/sass-shared:shared",
    ],
)

sass_binary(
    name = "hello_world_sourcemap_embed_sources",
    src = "main.scss",
    output_name = "main-sourcemap-embed-sources.css",
#    sourcemap_embed_sources = True,
    deps = [
        "//src/testdata/sass-shared:shared",
    ],
)

sass_binary(
    name = "hello_world_no_sourcemap",
    src = "main.scss",
    output_name = "main-no-sourcemap.css",
    sourcemap = False,
    deps = [
        "//src/testdata/sass-shared:colors",
        "//src/testdata/sass-shared:fonts",
    ],
)
