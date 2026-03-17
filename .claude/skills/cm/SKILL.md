---
name: cm
description: Generate a git commit message for staged changes, compatible with nx release conventional commits
---

# Git Commit Message Generator

Generate a well-formatted git commit message for the currently staged changes, compatible with `nx release` conventional commits for semantic versioning.

## Conventional Commit Types

| Type       | Changelog section | Version bump  |
| ---------- | ----------------- | ------------- |
| `feat`     | Features          | minor (0.x.0) |
| `fix`      | Bug Fixes         | patch (0.0.x) |
| `perf`     | Performance       | patch         |
| `refactor` | —                 | none          |
| `chore`    | —                 | none          |
| `docs`     | —                 | none          |
| `test`     | —                 | none          |
| `build`    | —                 | none          |
| `ci`       | —                 | none          |
| `style`    | —                 | none          |

A `BREAKING CHANGE:` footer triggers a major bump (x.0.0).

## Instructions

1. Run `git diff --cached` to see all staged changes
2. Run `git status` to see the list of staged files
3. Infer the Jira ticket ID from the branch name (e.g. `MOC-61` from `feature/MOC-61-...`) or recent commits. If not determinable, use `MOC-XXX` and ask.
4. Determine the correct conventional commit **type** from the table above based on the nature of the changes.
5. Generate a commit message in this format:

```
type(MOC-XX): short summary in imperative mood (≤72 chars total)

- Key change 1
- Key change 2
- Key change 3

BREAKING CHANGE: description  ← only if applicable
```

### Rules

- **Subject line**: `type(scope): summary` — scope is the Jira ticket ID (e.g. `MOC-61`)
- Summary: imperative mood, lowercase, no period, ≤72 chars total including prefix
- Blank line between subject and body
- Body: bullet list of primary changes — "what" changed, not implementation details
- Present tense ("add", "fix", "update" — not "added", "fixed", "updated")
- Only include `BREAKING CHANGE:` footer when there is an actual breaking change
- If multiple types apply, use the highest-impact one (`feat` > `fix` > `refactor` > `chore`)

6. Present the commit message in a code block and ask if the user wants to:
   - Use it as-is
   - Make modifications

## Examples

```
feat(MOC-40): add forgot password flow

- Add forgot password page with email input
- Add password reset token generation and email sending
- Add reset password page with token validation
```

```
fix(MOC-61): resolve ESLint config loading error

- Migrate from .eslintrc.json to flat config (eslint.config.js)
- Update plugins to v9-compatible versions
```

```
chore(MOC-99): upgrade dependencies

- Bump Next.js to 15.2.0
- Bump Prisma to 7.1.0
```
