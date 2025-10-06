import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import protoToAssign from "./rollup.proto-to-assign.plugin.mjs";

const input = "./src/index.js";

const external = ["react", "react-dom"];
const plugins = [babel(), nodeResolve(), commonjs(), protoToAssign()];
const minifiedPlugins = [
  ...plugins,
  replace({
    "process.env.NODE_ENV": '"production"',
  }),
  babel({
    babelrc: false,
    plugins: [
      "babel-plugin-minify-dead-code-elimination",
      "babel-plugin-transform-react-remove-prop-types",
    ],
  }),
  terser({
    compress: { warnings: false },
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
];
