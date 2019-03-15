workspace(name = "bazelin")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "251a023b6c5c5c97db1bfe24652dc19dad05f4da68f8e1821d92d911fa3f4ef4",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.27.4/rules_nodejs-0.27.4.tar.gz"],
)

http_archive(
    name = "io_bazel_rules_sass",
    # Make sure to check for the latest version when you install
    url = "https://github.com/bazelbuild/rules_sass/archive/1.17.3.zip",
    strip_prefix = "rules_sass-1.17.3",
    sha256 = "ea79647e5cd36867568d80811a951c7b3170791058f50a5cbd3d542627e78881",
)

# Fetch required transitive dependencies. This is an optional step because you
# can always fetch the required NodeJS transitive dependency on your own.
load("@io_bazel_rules_sass//:package.bzl", "rules_sass_dependencies")
rules_sass_dependencies()

# Setup the NodeJS toolchain
load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "check_bazel_version",  "npm_install", "yarn_install")
check_bazel_version("0.22.0");
node_repositories()

npm_install(
    name = "npm",
    package_json = "//:package.json",
    package_lock_json = "//:package-lock.json"
)

#yarn_install(
#  name = "npm",
#  package_json = "//:package.json",
#  yarn_lock = "//:yarn.lock",
#)

load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")
install_bazel_dependencies()

# Setup repositories which are needed for the Sass rules.
load("@io_bazel_rules_sass//:defs.bzl", "sass_repositories")
sass_repositories()

# Setup TypeScript toolchain
load("@npm_bazel_typescript//:index.bzl", "ts_setup_workspace")
ts_setup_workspace()
