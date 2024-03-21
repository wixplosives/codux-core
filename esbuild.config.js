// @ts-check
const React = require('react');

/** @type {import('esbuild').BuildOptions} */
module.exports = {
    alias: {
        // in react 17, we don't have react-dom/client, so we map itto an empty object
        // and handle it in runtime
        'react-dom/client':
            parseInt(React.version, 10) >= 18 ? 'react-dom/client' : require.resolve('./empty-exports.js'),
    },
};
