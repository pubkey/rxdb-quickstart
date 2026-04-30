const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


let mode = 'development';
const plugins = [
    new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
        template: 'src/index.html',
        filename: 'index.html',
        chunks: ['webrtc']
    }),
    new HtmlWebpackPlugin({
        template: 'src/google-drive.html',
        filename: 'google-drive.html',
        chunks: ['google-drive']
    }),
    new HtmlWebpackPlugin({
        template: 'src/onedrive.html',
        filename: 'onedrive.html',
        chunks: ['onedrive']
    }),
    new MiniCssExtractPlugin({ filename: 'src/style.css' }),
];
if (process.env.NODE_ENV === 'disc') {
    mode = 'production';
    plugins.push(new BundleAnalyzerPlugin());
}
if (process.argv.join(',').includes('mode=production')) {
    mode = 'production';
}

plugins.push(new webpack.DefinePlugin({ mode: JSON.stringify(mode) }));

module.exports = {
    entry: {
        'webrtc': './src/index.ts',
        'google-drive': './src/google-drive.ts',
        'onedrive': './src/onedrive.ts'
    },
    devtool: 'source-map',
    mode,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            /**
             * @link https://github.com/react-dnd/react-dnd/issues/3425#issuecomment-1177329608
             */
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false
                },
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin()
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].[contenthash].bundle.js',
        path: path.resolve(__dirname, 'docs'),
    },
    resolve: {
        extensionAlias: {
            '.js': ['.js', '.ts'],
        }
    },
    plugins
};
