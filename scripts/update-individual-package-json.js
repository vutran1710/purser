const path = require('path');
const chalk = require('chalk');
const findImports = require('find-imports');
var fs = require('fs');

const PATHS = require('./paths');

const { MODULES, FOLDERS, FILES } = PATHS;

const rootPackageFile = require(path.resolve('.', FILES.PACKAGE));
const corePackageFile = require(path.resolve(MODULES, 'purser-core', FILES.PACKAGE));

const PACKAGES = {
  BABEL_RUNTIME: '@babel/runtime',
  CORE: '@vutr/purser-core',
  ETHERS: 'ethers',
};

const buildIndividualModule = async (moduleName) => {
  const modulePath = path.resolve(MODULES, moduleName);
  const cjsBuildFolder = path.resolve(modulePath, FOLDERS.CJS_MODULES);
  const esBuildFolder = path.resolve(cjsBuildFolder, FOLDERS.ES_MODULES);
  const packageFilePath = path.resolve(modulePath, FILES.PACKAGE);
  const packageFile = require(packageFilePath);
  /*
   * Get individual package dependencies
   */
  const rawModuleDependencies = findImports(`${esBuildFolder}/**/*.js`, { flatten: true });
  const filteredModuleDependencies = rawModuleDependencies
    /*
     * Unify babel runtime module imports
     */
    .map(packageName => packageName.includes(PACKAGES.BABEL_RUNTIME) ? PACKAGES.BABEL_RUNTIME : packageName)
    /*
     * Unify core ES module imports
     */
    .map(packageName => packageName.includes(PACKAGES.CORE) ? PACKAGES.CORE : packageName)
    /*
     * Unify ethers ES module imports
     */
    .map(packageName => packageName.includes(PACKAGES.ETHERS) ? PACKAGES.ETHERS : packageName)
    /*
     * Remove duplicates
     */
    .filter(
      (possibileDuplicate, index, packages) => packages.indexOf(possibileDuplicate) === index
    )
    /*
     * Sort packages alphabetically
     */
    .sort();
  const moduleDependencies = {};
  filteredModuleDependencies.map(dependency => {
    /*
     * @TODO Error catching
     * If a certain package is not available
     */
    if (dependency === PACKAGES.CORE) {
      return moduleDependencies[PACKAGES.CORE] = corePackageFile.version;
    }
    return moduleDependencies[dependency] = rootPackageFile.dependencies[dependency];
  });
  /*
   * Get keywords
   */
  const commonKeywords = rootPackageFile.keywords || [];
  const individualKeywords = packageFile.keywords || [];
  /*
   * Assemble everything
   */
  const updatedPackageFile = Object.assign(
    {},
    packageFile,
    {
      private: false,
      /*
       * Library entry points
       */
      main: 'index.js',
      module: 'es/index.js',
      /*
       * Folders to include
       */
      files: [
        'es',
        'docs',
        '*.js'
      ],
      /*
       * Add links to the monorepo and author/license
       */
      repository: rootPackageFile.repository,
      author: rootPackageFile.author,
      license: rootPackageFile.license,
      bugs: rootPackageFile.bugs,
      homepage: rootPackageFile.homepage,
      keywords: [
        ...commonKeywords,
        ...individualKeywords,
      ],
      /*
       * Add dependencies object
       */
      dependencies: moduleDependencies,
    },
  );
  const jsonUpdatePackageFile = JSON.stringify(updatedPackageFile, null, '  ') + '\n';
  fs.writeFileSync(packageFilePath, jsonUpdatePackageFile, 'utf8');
};

module.exports = buildIndividualModule;
