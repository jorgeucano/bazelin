/*
const fs = require('fs-extra');
const npm = require('npm');

const packageObj = fs.readJsonSync('./package.json');

const packageForLib = {
  '@angular/bazel': '7.1.3',
  '@bazel/typescript': '0.22.1',
  '@bazel/ibazel': '0.9.1'
};

const packageJson = {...packageObj.dependencies, ...packageObj.devDependencies};

function loadPackage() {
  const result = Object.entries(packageForLib).reduce((acc, [key, val]) => {
    const entryPackage = packageJson[key] && packageJson[key].replace(/^\^|~/, '');
    return entryPackage !== val ? [...acc, `${key}@${val}`] : acc;
  }, []);

  if (result.length) {
    npm.load((err) => {
      // handle errors

      npm.commands.install(result, (er, data) => {
        // log errors or data
      });

      npm.on('log', (message) => {
        // log installation progress
        console.log(message);
      });
    });
  } else {
    console.log('All packages are installed');
  }
}

exports.module = loadPackage;
*/
