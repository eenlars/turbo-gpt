module.exports = {
  extends: [
    "@evan-yang",
    "plugin:astro/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "no-console": ["error", { allow: ["error"] }],
    "react/display-name": "off",
    "react-hooks/rules-of-hooks": "off",
    "no-tabs": "off",
    "@typescript-eslint/no-use-before-define": "off",
  },
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
      rules: {
        "no-tabs": "off",
        "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
      },
    },
    {
      files: ["**/*.astro/*.js", "*.astro/*.js"],
      parser: "@typescript-eslint/parser",
      rules: {
        "no-tabs": "off",
      },
    },
  ],
};
