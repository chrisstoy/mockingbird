const baseConfig = require('../../eslint.config.js');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    ...playwright.configs['flat/recommended'],
  },
  {
    files: ['src/**/*.{ts,js,tsx,jsx}'],
    rules: {},
  },
];
