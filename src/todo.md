0. Map npm deps and hacks for angular modules
- add "@npm//@angular/router" to root modules?
- "@npm//@angular/platform-browser/animation" -> "@npm//@angular/animation",
1. Merge ng_module rules inside one folder?
2. Cross dependencies?
3. Pop all npm deps to rollup_bundle
1. Create module.prod.ts rule
- apply it only if main.prod is above app.module it depends on
- if main.prod in the same folder as app.module it depends -> include in srcs 
    ```ts
    ng_module(
        name = "application",
         srcs = glob(
                include = ["**/*.ts"],
                exclude = [
                    "**/*.spec.ts",
                    "main.ts",
                    "test.ts",
                    "initialize_testbed.ts",
                ],
            ),
        assets = [
        // <- sass entry points
            "//src/testdata/ng-app-non-lazy/styles:main",
        ],
        deps = [
        // <- main.prod dep to module
            "//src/testdata/ng-app-non-lazy/app:app-component",
            "@npm//@angular/core",
            "@npm//@angular/platform-browser",
            "@npm//@angular/animations",
            "@npm//@angular/platform-browser-dynamic",
            "@npm//@angular/router",
            "@npm//@types",
        ],
    )
    ```
2. rollup rule
3. ts_devserver rule
4. create WORKSPACE, main.prod.ts, i
5. install npm dependencies?
