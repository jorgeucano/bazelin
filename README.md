# Bazelin

### This tool could reduce manual time required to bootstrap Bazel build config files in your angular project

First clone bazelin

- git clone https://github.com/valor-software/bazelin.git

In your proyect

- create `main.prod.ts`
- copy from bazelin `WORKSPACE` `.bazelrc` `.bazelignore` `BUILD.bazel`
- run `npm install --save-dev @angular/bazel @bazel/bazel @bazel/ibazel @bazel/buildifier @bazel/typescript @bazel/jasmine @bazel/karma`
- copy from bazelin `angular-metadata.tsconfig.json`
- In the package.json add `"postinstall": "ngc -p ./angular-metadata.tsconfig.json"`

In Bazelin
- `yarn install | npm i`
- `yarn build | npm run build`

- run `fix-sass` script `src --root=./project/root`, to replace `~` with relative imports
    (ie: `node ./dist/bin/fix-sass-imports-cli.js src --root=/Users/bazelin-user/Documents/your-angular-app/`)

- replace `.sass|.scss` imports in `.ts` files with `.css` imports

8. run `bazel-cli` script `src --root=./project/root` to generate bazel build configs
    (ie: `node ./dist/bin/bazelin-cli.js src --root=/Users/bazelin-user/Documents/your-angular-app/`)