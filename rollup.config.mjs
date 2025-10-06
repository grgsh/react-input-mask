import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
// eslint-disable-next-line import/no-extraneous-dependencies
import typescript from "@rollup/plugin-typescript";
import protoToAssign from "./rollup.proto-to-assign.plugin.mjs";

const input = "./src/index.tsx";

const external = ["react", "react-dom"];
const plugins = [
  typescript({
    tsconfig: "./tsconfig.build.json",
  }),
  babel({
    exclude: "node_modules/**",
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  }),
  nodeResolve({
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  }),
  commonjs(),
  protoToAssign(),
];
const minifiedPlugins = [
  ...plugins,
  replace({
    "process.env.NODE_ENV": '"production"',
  }),
  babel({
    babelrc: false,
    exclude: "node_modules/**",
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    plugins: [
      "babel-plugin-minify-dead-code-elimination",
      "babel-plugin-transform-react-remove-prop-types",
    ],
  }),
  terser({
    compress: {
      warnings: false,
      drop_console: false, // Preserve console.log statements
    },
  }),
];

export default [
  {
    input,
    output: {
      file: "dist/react-input-mask.js",
      format: "umd",
      name: "ReactInputMask",
      globals: { react: "React", "react-dom": "ReactDOM" },
    },
    external,
    plugins: [
      ...plugins,
      replace({
        "process.env.NODE_ENV": '"development"',
      }),
    ],
  },

  {
    input,
    output: {
      file: "dist/react-input-mask.min.js",
      format: "umd",
      name: "ReactInputMask",
      globals: { react: "React", "react-dom": "ReactDOM" },
    },
    external,
    plugins: minifiedPlugins,
  },

  {
    input,
    output: { file: "lib/react-input-mask.development.js", format: "cjs" },
    external,
    plugins,
  },

  {
    input,
    output: { file: "lib/react-input-mask.production.min.js", format: "cjs" },
    external,
    plugins: minifiedPlugins,
  },

  // ES Module builds for modern bundlers
  {
    input,
    output: { file: "lib/react-input-mask.esm.js", format: "es" },
    external,
    plugins,
  },

  {
    input,
    output: { file: "lib/react-input-mask.esm.min.js", format: "es" },
    external,
    plugins: minifiedPlugins,
  },
];
