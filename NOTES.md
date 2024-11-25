# Notes on development and deployments

## Docker

- must set `output: 'standalone'` in next.config.js
- after build
  - copy `.next/static` folder to `standalone/apps/mockingbird/.next` folder
  - copy `public` folder to `standalone/apps/mockingbird`

## Vercel

- need to add `runtime: 'nodejs'` to `middleware.ts` config. This will run the middleware on the NodeJS runtime instead of the Edge runtime.
- Vercel handles storing console logs, so we don't need our own file logging. In fact, trying to write a local file seems to cause an error. Need to disable File logging when running on Vercel.

  - using `env` does not seem to expose the VERCEL variables. The can be found on `process.env`.

- Need to enable CORS for API calls
