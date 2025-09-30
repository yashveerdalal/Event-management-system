import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  // Global ignores
  {
    ignores: ["dist"],
  },

  // Main configuration for JS/JSX files
  {
    files: ["**/*.{js,jsx}"],

    // 1. Add plugins for React Hooks and React Refresh
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    // 2. Spread the rules from recommended configs and add your own
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
      "no-unused-vars": "warn", // Changed to warn to be less disruptive
    },
  },
];
