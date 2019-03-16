#!/usr/bin/env bash

bazel build //src/testdata/sass-demo:demo
bazel build //src/testdata/sass-hello_world:hello_world
bazel build //src/testdata/sass-nested:nested
bazel build //src/testdata/sass-shared:shared
bazel build //src/testdata/sass-imports_css:imports_css
# add samples
# 1. import css from node_modules
# 2. import sass from node_modules


bazel build //src/testdata/ts-library:user-model
bazel build //src/testdata/ts-library-deps:user-list-model
bazel build //src/testdata/ts-services:main-service
# add samples
#1. import js from node_modules
#2. import js+d.ts(ts) lib from node_modules

bazel build //src/testdata/ng-module:src
# add samples
#1. ng_module with @angular module import
#2. ng_module with import from ngx-bs
#3. module with routing (no-lazy loading)
#4. module with routing (with lazy-loading)
