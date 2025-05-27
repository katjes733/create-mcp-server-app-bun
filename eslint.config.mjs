import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
  js.configs.recommended, // ESLint recommended rules
  {
    name: "node-bun-config",
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: true, // Allow Node.js global variables
        module: true,
        require: true, // If using CommonJS
        Bun: true, // Bun-specific global
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {},
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    settings: {
      "import/resolver": {
        node: true, // Ensure Node.js/Bun module resolution
      },
    },
  },
];
