#!/usr/bin/env bash

bazel build //src/testdata/sass-demo:demo
bazel build //src/testdata/sass-hello_world:hello_world
bazel build //src/testdata/sass-nested:nested
bazel build //src/testdata/sass-shared:shared
bazel build //src/testdata/sass-imports_css:imports_css
