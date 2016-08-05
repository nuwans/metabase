"use strict";
/*eslint-env node */

var webpack = require('webpack');
var webpackPostcssTools = require('webpack-postcss-tools');

var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var UnusedFilesWebpackPlugin = require("unused-files-webpack-plugin").default;
var FlowStatusWebpackPlugin = require('flow-status-webpack-plugin');

var _ = require('underscore');
var glob = require('glob');
var fs = require('fs');

function hasArg(arg) {
    var regex = new RegExp("^" + ((arg.length === 2) ? ("-\\w*"+arg[1]+"\\w*") : (arg)) + "$");
    return process.argv.filter(regex.test.bind(regex)).length > 0;
}

var SRC_PATH = __dirname + '/frontend/src/metabase';
var BUILD_PATH = __dirname + '/resources/frontend_client';


// Need to scan the CSS files for variable and custom media used across files
// NOTE: this requires "webpack -w" (watch mode) to be restarted when variables change :(
var isWatching = hasArg("-w") || hasArg("--watch");
if (isWatching) {
    console.warn("Warning: in webpack watch mode you must restart webpack if you change any CSS variables or custom media queries");
}

// default NODE_ENV to production unless -d or --debug is specified
var NODE_ENV = process.env["NODE_ENV"] || (hasArg("-d") || (hasArg("--debug")) ? "development": "production");
console.log("webpack env:", NODE_ENV)

// Babel:
var BABEL_CONFIG = {
    cacheDirectory: ".babel_cache"
};

// Build mapping of CSS variables
var CSS_SRC = glob.sync(SRC_PATH + '/css/**/*.css');
var CSS_MAPS = { vars: {}, media: {}, selector: {} };
CSS_SRC.map(webpackPostcssTools.makeVarMap).forEach(function(map) {
    for (var name in CSS_MAPS) _.extend(CSS_MAPS[name], map[name]);
});

// CSS Next:
var CSSNEXT_CONFIG = {
    features: {
        // pass in the variables and custom media we scanned for before
        customProperties: { variables: CSS_MAPS.vars },
        customMedia: { extensions: CSS_MAPS.media }
    },
    import: {
        path: ['resources/frontend_client/app/css']
    },
    compress: false
};

var CSS_CONFIG = {
    localIdentName: NODE_ENV !== "production" ?
        "[name]__[local]___[hash:base64:5]" :
        "[hash:base64:5]",
    restructuring: false,
    compatibility: true,
    importLoaders: 1
}

var config = module.exports = {
    context: SRC_PATH,

    // output a bundle for the app JS and a bundle for styles
    // eventually we should have multiple (single file) entry points for various pieces of the app to enable code splitting
    entry: {
        vendor: './vendor.js',
        app: './app.js',
        styles: './css/index.css',
    },

    // output to "dist"
    output: {
        path: BUILD_PATH + '/app/dist',
        // NOTE: the filename on disk won't include "?[chunkhash]" but the URL in index.html generated by HtmlWebpackPlugin will:
        filename: '[name].bundle.js?[hash]',
        publicPath: '/app/dist/'
    },

    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: "babel",
                query: BABEL_CONFIG
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules|\.spec\.js/,
                loader: 'eslint'
            },
            {
                test: /\.(eot|woff2?|ttf|svg)$/,
                loader: "file-loader"
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader?" + JSON.stringify(CSS_CONFIG) + "!postcss-loader")
            }
        ],
        noParse: [
            /node_modules\/(angular|ace|moment|underscore)/ // doesn't include 'crossfilter', 'dc', and 'tether' due to use of 'require'
        ]
    },

    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".js", ".jsx", ".css"],
        alias: {
            'metabase':             SRC_PATH,
            'style':                SRC_PATH + '/css/core/index.css',

            // angular
            'angular':              __dirname + '/node_modules/angular/angular.min.js',
            'angular-cookies':      __dirname + '/node_modules/angular-cookies/angular-cookies.min.js',
            'angular-resource':     __dirname + '/node_modules/angular-resource/angular-resource.min.js',
            'angular-route':        __dirname + '/node_modules/angular-route/angular-route.min.js',
            // angular 3rd-party
            'angular-cookie':       __dirname + '/node_modules/angular-cookie/angular-cookie.min.js',
            'angular-http-auth':    __dirname + '/node_modules/angular-http-auth/src/http-auth-interceptor.js',
            // ace
            'ace':                  __dirname + '/node_modules/ace-builds/src-min-noconflict',

            // react
            'fixed-data-table':     __dirname + '/node_modules/fixed-data-table/dist/fixed-data-table.min.js',
            // misc
            'moment':               __dirname + '/node_modules/moment/min/moment.min.js',
            'tether':               __dirname + '/node_modules/tether/dist/js/tether.min.js',
            'underscore':           __dirname + '/node_modules/underscore/underscore-min.js',
            'd3':                   __dirname + '/node_modules/d3/d3.min.js',
            'crossfilter':          __dirname + '/node_modules/crossfilter/index.js',
            'dc':                   __dirname + '/node_modules/dc/dc.min.js',
            'humanize':             __dirname + '/node_modules/humanize-plus/dist/humanize.min.js'
        }
    },

    plugins: [
        new UnusedFilesWebpackPlugin({
            globOptions: {
                ignore: [
                    "**/types/*.js"
                ]
            }
        }),
        // Separates out modules common to multiple entry points into a single common file that should be loaded first.
        // Not currently useful but necessary for code-splitting
        new CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity // (with more entries, this ensures that no other module goes into the vendor chunk)
        }),
        // Extracts initial CSS into a standard stylesheet that can be loaded in parallel with JavaScript
        // NOTE: the filename on disk won't include "?[chunkhash]" but the URL in index.html generated by HtmlWebpackPlugin will:
        new ExtractTextPlugin('[name].bundle.css?[contenthash]'),
        new HtmlWebpackPlugin({
            filename: '../../index.html',
            template: __dirname + '/resources/frontend_client/index_template.html',
            inject: 'head'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(NODE_ENV)
            }
        })
    ],

    postcss: function (webpack) {
        return [
            require("postcss-import")({ addDependencyTo: webpack }),
            require("postcss-url")(),
            require("postcss-cssnext")(CSSNEXT_CONFIG)
        ]
    }
};

if (NODE_ENV === "hot") {
    config.entry.app = [
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/only-dev-server',
        config.entry.app
    ];

    // suffixing with ".hot" allows us to run both `npm run build-hot` and `npm run test` or `npm run test-watch` simultaneously
    config.output.filename = "[name].hot.bundle.js?[hash]";

    // point the publicPath (inlined in index.html by HtmlWebpackPlugin) to the hot-reloading server
    config.output.publicPath = "http://localhost:8080" + config.output.publicPath;

    config.module.loaders.unshift({
        test: /\.jsx$/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel?'+JSON.stringify(BABEL_CONFIG)]
    });

    // disable ExtractTextPlugin
    config.module.loaders[config.module.loaders.length - 1].loader = "style-loader!css-loader?" + JSON.stringify(CSS_CONFIG) + "!postcss-loader"

    config.plugins.unshift(
        new webpack.NoErrorsPlugin()
    );
}

// development environment:
if (NODE_ENV === "development" || NODE_ENV === "hot") {
    // replace minified files with un-minified versions
    for (var name in config.resolve.alias) {
        var minified = config.resolve.alias[name];
        var unminified = minified.replace(/[.-\/]min\b/g, '');
        if (minified !== unminified && fs.existsSync(unminified)) {
            config.resolve.alias[name] = unminified;
        }
    }
}

if (process.env.ENABLE_FLOW) {
    config.plugins.push(new FlowStatusWebpackPlugin());
}

if (NODE_ENV === "hot" || isWatching) {
    // enable "cheap" source maps in hot or watch mode since re-build speed overhead is < 1 second
    config.devtool = "eval-cheap-module-source-map";
} else if (NODE_ENV === "production") {
    config.devtool = "source-map";
}
