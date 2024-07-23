const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        mockingbird: {
          primary: '#8e7d75',
          secondary: '#774f43',
          accent: '#e5d9db',
          neutral: '#796a6f',
          'base-100': '#f6f4f5',
          info: '#77a7d8',
          success: '#2fd479',
          warning: '#b9530f',
          error: '#d62200',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
