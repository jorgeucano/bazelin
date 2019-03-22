# Bazelin

This tool could reduce manual time required to bootstrap Bazel build config files in your angular project

1. create `main.prod.ts`
2. copy `WORKSPACE` `.bazelrc`
3. `npm install --save-dev @bazel/bazel @bazel/ibazel @bazel/buildifier`
4. cp `angular-metadata.tsconfig.json`
5. add `"postinstall": "ngc -p ./angular-metadata.tsconfig.json", to package.json`

6. run `fix-sass` script `src --root=./project/root`, to replace `~` with relative imports
7. replace `.sass|.scss` imports in `.ts` files with `.css` imports

8. run `bazel-cli` script to generate bazel build configs
