const nxPlugin = require('@nx/eslint-plugin');
const nextConfig = require('eslint-config-next/core-web-vitals');
const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  // Next.js and React configs (flat config format)
  ...nxPlugin.configs['flat/react-typescript'],
  ...nextConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['.next/**/*', './next-env.d.ts'],
    rules: {
      '@next/next/no-html-link-for-pages': ['error', 'apps/mockingbird/pages'],
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    languageOptions: {
      globals: {
        jest: true,
      },
    },
  },
];
