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

- ensure env variables are correctly set for each deployment type (production, preview, development).
-

## SDLC

### Developing a feature

- ensure a Jira for feature exists and add it to current Release in Jira
- create a feature branch from `develop` -> `feature/MOC-XXX-...`
- develop feature, commit changes to branch, and test
  - local testing
  - preview testing of commits to branch through Vercel
- create PR in GitHub
  - squash-merge branch into `develop`
  - delete feature branch
- mark Jira as Complete

### Releasing to Production

- create a release branch from `develop` -> `release/x.x.x`
- update CHANGELOG.md with all changes since previous release
- update version to release version
- merge release branch into `develop`
- merge release branch into `main`
  - merging into `main` triggers production build on Vercel
  - tag `main` with release version `x.x.x`
- delete release branch
- marke Release as complete in Jira
- create next Release in Jira

## Database Reset

To remove all migrations and clear all data (uses `DATABASE_URL` from environment):

```bash
rm -rf apps/mockingbird/prisma/migrations
npx prisma db push --force-reset --schema=apps/mockingbird/prisma/schema.prisma
```

Verify which database will be affected first:
```bash
echo $DATABASE_URL
```
