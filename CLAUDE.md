## Commands

```bash
nx run mockingbird:dev               # Start dev server (Next.js)
nx run mockingbird:build             # Production build
nx run mockingbird:test              # Run unit tests (Jest)
nx run mockingbird:lint              # ESLint
nx run mockingbird:prisma-generate   # Regenerate Prisma client after schema changes
nx run mockingbird:prisma-migrate    # Run DB migrations
nx run mockingbird:prisma-studio     # Open Prisma Studio GUI
nx run-many -t test                  # Run all tests across workspace
```

## Gotchas

- **Prisma**: Run `nx run mockingbird:prisma-generate` after any `schema.prisma` change
- **Client components**: Must use `.client.tsx` suffix AND `"use client"` directive
- **Server components default**: `.tsx` files without suffix are Server Components
- **Env vars**: `DATABASE_URL`, `AUTH_SECRET`, `CLOUDFLARE_*` required to run locally
- **Nx caching**: If stale output, use `--skip-nx-cache` flag

## Architecture Reference

See `.claude/reference/architecture.md` for full architecture docs (stack, directory structure, DB schema, API routes, auth, image storage, patterns).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
