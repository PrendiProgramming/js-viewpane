const path = require("path"); // eslint-disable-line
const TerserPlugin = require("terser-webpack-plugin"); // eslint-disable-line
const PRODUCTION = process.env.NODE_ENV === "production";
const HtmlWebpackPlugin = require("html-webpack-plugin");


const APP = {
    camera: {
        index: "./app/app-camera.ts",
        html: "app/index.html"
    },
    matrix: {
        index: "./app/viewMatrix.ts",
        html: "app/viewMatrix.html"
    }
}

// const app = APP.matrix;
const app = APP.camera;


const config = {
    entry: [app.index],
    mode: PRODUCTION ? "production" : "development",
    context: __dirname,
    target: "web",
    devtool: PRODUCTION ? false : "source-map",
    stats: { children: false },
    output: {
        path: path.resolve(__dirname, PRODUCTION ? "dist" : "dev"),
        filename: 'app-camera.js'
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {}
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                        compilerOptions: {
                            sourceMap: !PRODUCTION,
                            declaration: PRODUCTION
                        }
                    }
                }
            },
            {
                test: /\.jpe?g$|\.gif$|\.png$|\.woff\d?$|\.ttf$|\.eot|\.otf|\.wav$|\.mp3$/,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 1000,
                            name: "[name].[ext]"
                        }
                    }
                ]
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({ template: app.html })
    ],

    optimization: {
        minimizer: [new TerserPlugin()]
    },

    devServer: {
        port: 8080,
        disableHostCheck: true,
        host: "0.0.0.0"
    }
};


module.exports = config;
