const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (_, argv) => {
  const devMode = argv.mode !== "production";

  return {
    entry: {
      app: "./src/app.tsx",
    },
    mode: "development",
    devtool: devMode ? "source-map" : false,
    devServer: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
      static: "./dist",
      port: 8001,
      hot: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                url: false,
              },
            },
            "less-loader",
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".html", ".svg"],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: "./src",
            filter: (s) =>
              /\.(svg|png|jpe?g|html|ogg)/.test(s) ||
              /stockfish\.(js|wasm|worker\.js)/.test(s),
          },
        ],
      }),
      new MiniCssExtractPlugin(),
    ],
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    stats: {
      assets: true,
      relatedAssets: true,
      modules: false,
      timings: false,
      version: false,
    },
  };
};
