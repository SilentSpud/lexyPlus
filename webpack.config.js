// @ts-check
import WebpackUserscript from "webpack-userscript";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dev = process.env.NODE_ENV === "development";
const outputPath = process.env.OUTPUT || join(dirname(fileURLToPath(import.meta.url)), "build");
const basePath = process.env.BASE_PATH;

/** @type { import('webpack').Configuration } */
const WebpackConfig = {
  mode: dev ? "development" : "production",
  devtool: dev ? "inline-source-map" : false,
  entry: {
    lexy: "./src/index.ts",
  },
  experiments: {
    topLevelAwait: true,
  },
  externals: {
    dexie: "Dexie",
  },
  output: {
    path: outputPath,
    filename: "[name].user.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  // Disable all of webpack-dev-server's refresh features. We use the script manager to do this
  devServer: {
    static: {
      directory: outputPath,
    },
    compress: true,
    port: 8080,
    webSocketServer: false,
    open: ["/lexy.user.js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
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
        require: [
          "https://unpkg.com/dexie@3.2.2/dist/dexie.min.js", // Dexie for database
        ],
      }),
      proxyScript: {
        enable: false,
      },
    }),
  ],
};
export default WebpackConfig;
