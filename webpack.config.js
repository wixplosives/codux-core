/** @type {import('webpack').Configuration} */
module.exports = {
    context: __dirname,
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                loader: 'source-map-loader',
            },
        ],
    },
};
