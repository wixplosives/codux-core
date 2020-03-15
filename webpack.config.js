require('@ts-tools/node/r');

module.exports = {
    // root of the monorepo, so that paths in output will be clickable
    context: __dirname,

    // works great. with the default 'eval', imports are not mapped.
    devtool: 'source-map',

    resolve: {
        extensions: ['.ts', '.tsx', '.mjs', '.js', '.json']
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /\.d\.ts$/,
                loader: '@ts-tools/webpack-loader',
                options: {
                    configFilePath: require.resolve('./tsconfig.json')
                }
            }
        ],
        noParse: [require.resolve('typescript/lib/typescript.js')]
    }
};
