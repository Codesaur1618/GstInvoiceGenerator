module.exports = {
  // Disable ESLint for the root directory
  root: true,
  env: {
    node: true,
  },
  extends: [],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {},
  // Explicitly disable all ESLint rules
  overrides: [
    {
      files: ['**/*'],
      rules: {
        // Disable all rules
      },
    },
  ],
};
