const OFF = 0;
// const WARN = 1;
const ERROR = 2;

module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["airbnb", "prettier"],
  plugins: ["prettier", "react-hooks"],
  env: {
    browser: true,
  },
  rules: {
    "react/jsx-filename-extension": OFF,
    "react/jsx-props-no-spreading": OFF,
    "react/require-default-props": OFF,
    "react/no-find-dom-node": OFF,
    "react/prop-types": [ERROR, { ignore: ["value", "defaultValue"] }],
    "react-hooks/rules-of-hooks": ERROR,
    "react-hooks/exhaustive-deps": ERROR,
    "no-shadow": OFF,
    "no-param-reassign": OFF,
    "no-plusplus": OFF,
    "global-require": OFF,
    "consistent-return": OFF,
    "prefer-const": [
      ERROR,
      {
        destructuring: "all",
      },
    ],
    "prettier/prettier": ERROR,
    "import/extensions": [
      ERROR,
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ["@typescript-eslint"],
      extends: ["airbnb", "prettier"],
      rules: {
        // TypeScript specific rules
        "@typescript-eslint/no-explicit-any": OFF,
        "@typescript-eslint/explicit-function-return-type": OFF,
        "@typescript-eslint/explicit-module-boundary-types": OFF,
        "@typescript-eslint/no-unused-vars": ERROR,
        "no-unused-vars": OFF,

        // Disable conflicting rules
        "react/prop-types": OFF, // TypeScript handles this
        "no-undef": OFF, // TypeScript handles this
        "react/jsx-filename-extension": OFF, // Allow JSX in .tsx files
        "react/jsx-props-no-spreading": OFF, // Allow prop spreading
        "no-param-reassign": OFF, // Allow parameter reassignment
        "no-plusplus": OFF, // Allow ++ and -- operators
        "consistent-return": OFF, // Allow inconsistent returns
        "no-shadow": OFF, // Allow variable shadowing

        // Import extensions
        "import/extensions": [
          ERROR,
          "ignorePackages",
          {
            js: "never",
            jsx: "never",
            ts: "always",
            tsx: "always",
          },
        ],
      },
    },
    {
      files: [
        "*.config.js",
        "*.config.mjs",
        "webpack.config.js",
        "rollup.config.mjs",
        "karma.conf.js",
      ],
      rules: {
        "import/no-extraneous-dependencies": [
          ERROR,
          {
            devDependencies: true,
            optionalDependencies: true,
            peerDependencies: true,
            packageDir: "./",
          },
        ],
      },
    },
  ],
};
