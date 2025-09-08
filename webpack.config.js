const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const HtmlWebPackPLugin = require('html-webpack-plugin');

let htmlPageNames = ['index'];
let multipleHtmlPlugins = htmlPageNames.map(name => {
  return new HtmlWebPackPLugin({
    template: `./src/html/${name}.html`, // relative path to the HTML files
    filename: `${name}.html`, // output HTML files
    excludeChunks: ["server", "main"]
    ///chunks: [`${name}`] // respective JS files
  })
});

module.exports = {
    entry: {
        main: './src/index.js',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].js'
    },
    target: 'web',
    devtool: 'source-map',
    mode: 'production',
    optimization: {
        minimize: true
    },
    module: {
        rules: [
            {
                //Transpiles ES6-8 into ES5
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                //Loads the javascript into html template provided
                //Entry point is set below in HtmlWebPackPlugin in Plugins
                test: /\.html$/,
                use: [
                    {
                        loader: "html-loader",
                        options: {minimize: true}
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    plugins: [
        new HtmlWebPackPLugin({
            template: './src/html/map.html',
            filename: './map.html',
            excludeChunks: ['server']
        })
    ].concat(multipleHtmlPlugins)
}