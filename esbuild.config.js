// @ts-check

import { fileURLToPath } from 'node:url';
import { builtinModules as nativeNodeApis } from 'node:module';

// Used as a polyfill for node apis when they aren't available.
// The key is the node api name and the value is the stand-in object.
const emptyModulePath = fileURLToPath(import.meta.resolve(`./empty-object.js`));
const utilModulePath = fileURLToPath(import.meta.resolve(`./micro-util-nofill.js`));

// get all native node apis
/** @type {Record<string, string>} */
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
export default {
    alias,
    loader: {
        '.jpg': 'file',
        '.png': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.d.ts': 'file',
    },
};
