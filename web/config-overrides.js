const webpack = require('webpack');
const dotEnv = require('dotenv-webpack')

module.exports = function override(config, env) {
    config.module.rules = config.module.rules.concat(
        [
            {
                test: /\.glb$/,
                type: 'asset/inline'
            },
            {
                test: /\.gltf$/,
                type: 'asset/inline'
            },
            {
                test: /\.m?js/,
                resolve: {
                  fullySpecified: false,
                }
            }
        ]
    );
    config.resolve.fallback = {
        buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify')
    };
    config.plugins.push(
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    );
    config.plugins.push(new dotEnv())

    return config;
}