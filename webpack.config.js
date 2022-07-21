import WebpackUserscript from "webpack-userscript";
import UglifyJsPlugin from "uglifyjs-webpack-plugin";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dev = process.env.NODE_ENV === "development";
const outputPath = process.env.OUTPUT || join(dirname(fileURLToPath(import.meta.url)), "build");
const basePath = process.env.BASE_PATH;

const WebpackConfig = {
  mode: dev ? "development" : "production",
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
          toplevel: true,
          keep_fnames: true,
          mangle: true,
          output: {
            beautify: false,
            comments: false,
          },
        },
      }),
    ],
  },
  entry: {
    lexy: "./src/index.ts",
  },
  output: {
    path: outputPath,
    filename: "[name].user.js",
  },
  resolve: {
    extensions: [".ts", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
              },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new WebpackUserscript({
      headers: ({ name, version, description, author }) => ({
        name,
        description,
        version,
        author,
        include: ["https://lexyslotd.com/guide/*"],
        namespace: "LOTDPlus",
        grant: ["GM_xmlhttpRequest"],
      }),
      proxyScript: {
        enable: false,
      },
    }),
  ],
};
export default WebpackConfig;
