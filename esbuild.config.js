// @ts-check

// Used as a polyfill for node apis when they aren't available.
// The key is the node api name and the value is the stand-in object.
const emptyModulePath = require.resolve(`./empty-object.js`);
const utilModulePath = require.resolve(`./micro-util-nofill.js`);

// get all native node apis

const nativeNodeApis = require('module').builtinModules;

const alias = {};
for (const nodeApi of nativeNodeApis) {
    if (nodeApi === 'util') {
        alias[nodeApi] = utilModulePath;
        alias[`node:${nodeApi}`] = utilModulePath;
    } else {
        alias[nodeApi] = emptyModulePath;
        alias[`node:${nodeApi}`] = emptyModulePath;
    }
}

/** @type {import('esbuild').BuildOptions} */
module.exports = {
    plugins: [],
    alias,
    loader: {
        '.jpg': 'file',
        '.png': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.d.ts': 'file',
    },
};
