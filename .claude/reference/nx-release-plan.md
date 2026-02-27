# Nx Release Setup Plan

## Goal
Configure `nx release` for semantic versioning with conventional commits and changelog generation.

## 1. Update `nx.json`

Add a `release` block targeting only the `mockingbird` app (not libraries/tools):

```json
"release": {
  "projects": ["mockingbird"],
  "conventionalCommits": true,
  "version": {
    "conventionalCommits": true
  },
  "changelog": {
    "workspaceChangelog": {
      "file": "CHANGELOG.md",
      "createRelease": false
    }
  },
  "git": {
    "commitMessage": "chore(release): {version}",
    "tagPattern": "v{version}"
  }
}
```

## 2. Update `next.config.js` (or `next.config.ts`)

Expose version to the app at build time:

```js
env: {
  NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? '0.0.0',
}
```

## 3. Vercel environment (optional)

No changes needed — `npm_package_version` is available automatically during Vercel builds since it runs `npm install` first.

## 4. Initialize

```bash
# Set the starting version in package.json to something real (e.g. 0.1.0)
# then do a first release:
nx release --first-release --dry-run   # preview
nx release --first-release             # execute: bumps version + creates CHANGELOG + git tag
git push && git push --tags
```

## Commit message convention going forward

| Prefix | Effect |
|--------|--------|
| `fix:` | patch bump (0.0.x) |
| `feat:` | minor bump (0.x.0) |
| `BREAKING CHANGE:` in footer | major bump (x.0.0) |
| `chore:`, `docs:`, `test:` | no bump |

Jira refs are compatible: `feat(MOC-40): add forgot password`

## Release cadence (per sprint / deploy)

```bash
nx release --dry-run    # review what will change
nx release              # bump version, write CHANGELOG, commit + tag
git push && git push --tags
```
