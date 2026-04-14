---
name: bump-version
description: Bump version in version.json and update CHANGELOG with completed Jira tickets
---

# Bump Version Skill

Bump the application version and update the CHANGELOG.md with Jira tickets that have been completed and merged into develop since the last version.

## Context

`develop` always carries the **next** version — the version being actively built. `main` holds the last released version. This skill is run **after** a production deploy to advance `develop` to the next cycle, or manually when starting a new release cycle.

## Invocation modes

- **`/bump-version`** — interactive: prompts the user for the next version number
- **`/bump-version --auto-minor`** — automatic: increments the MINOR component without prompting (e.g. `0.6.0 → 0.7.0`). Used by the `deploy-app` skill post-prod-deploy.

## Process

1. **Find the last version tag**
   - List all version tags and identify the most recent one
   - Tags follow format `vX.Y.Z` (e.g., `v0.2.6`)
   - Command: `git tag | grep -E '^v[0-9]' | sort -V | tail -1`

2. **Read current version from version.json**
   - Read `apps/mockingbird/version.json` to see current version

3. **Determine next version number**
   - **`--auto-minor` mode**: increment MINOR, reset PATCH to 0 (e.g. `0.6.0 → 0.7.0`). No prompt.
   - **Interactive mode**: ask the user what the next version should be. Explain options:
     - PATCH (`0.6.0 → 0.6.1`): Bug fixes, small changes
     - MINOR (`0.6.0 → 0.7.0`): New features, backward compatible
     - MAJOR (`0.6.0 → 1.0.0`): Breaking changes

4. **Update version.json**
   - Update `apps/mockingbird/version.json` with the new version number
   - Update `buildDate` to current ISO timestamp
   - Format:
     ```json
     {
       "version": "X.Y.Z",
       "buildDate": "YYYY-MM-DDTHH:mm:ss.sssZ"
     }
     ```

5. **Get commits on develop since last tag**
   - Use `git log vX.Y.Z..develop --oneline` to see all commits
   - Review commit messages to identify Jira tickets

6. **Extract Jira ticket IDs**
   - Use pattern matching to find all `MOC-[0-9]+` references
   - Sort and deduplicate the ticket list
   - Command: `git log vX.Y.Z..develop --online | grep -Eo 'MOC-[0-9]+' | sort -u`

7. **Update CHANGELOG.md**
   - If a placeholder section for this version already exists at the top (e.g. `# Release notes - Mockingbird - 0.6.0` with a "no tickets yet" note), **replace it** with the real entries — do not insert a duplicate header.
   - If no section exists yet, insert a new release section at the TOP of the file.
   - Use this format:
     ```markdown
     # Release notes - Mockingbird - X.Y.Z

     ### Task

     - [MOC-##](https://stoy.atlassian.net/browse/MOC-##) Description
     - [MOC-##](https://stoy.atlassian.net/browse/MOC-##) Description
     ```
   - Extract descriptions from commit messages
   - Sort tickets numerically by ticket number
   - Maintain consistent formatting with existing entries

8. **Verify**
   - Show the user:
     - New version number in version.json
     - New CHANGELOG entries
   - Confirm all tickets from develop are included

9. **Remind user to update Jira Release**
   - Inform the user that they need to ensure the corresponding Release version `X.Y.Z` exists in Jira and that all tickets are associated with it
   - List all ticket IDs that should be in the release (from step 6)
   - Link to the Jira releases page: https://stoy.atlassian.net/projects/MOC/versions

## Example Commands

```bash
# Find last version tag
git tag | grep -E '^v[0-9]' | sort -V | tail -1

# Get current version
cat apps/mockingbird/version.json

# Get commits since last tag
git log v0.2.6..develop --oneline

# Extract Jira tickets
git log v0.2.6..develop --oneline | grep -Eo 'MOC-[0-9]+' | sort -u

# Get commit message for a specific ticket (for description)
git log v0.2.6..develop --oneline | grep 'MOC-31'
```

## Notes

- Only include tickets merged to `develop` branch
- Do NOT include tickets from feature branches that aren't merged yet
- The Jira URL pattern is: `https://stoy.atlassian.net/browse/MOC-##`
- Keep descriptions concise - use the commit message or PR title as the description
- The buildDate should use ISO 8601 format with timezone
- **Interactive mode** — after running this skill, the user should:
  1. Commit the changes (`git add apps/mockingbird/version.json CHANGELOG.md && git commit -m "chore: bump version to X.Y.Z"`)
  2. Create a git tag for the new version (`git tag vX.Y.Z`)
  3. Push (`git push origin develop && git push origin vX.Y.Z`)
- **`--auto-minor` mode (called from deploy-app)** — the caller (deploy-app Step 13) handles all committing, tagging, and pushing. Do NOT follow the interactive steps above. The tag created is for the version that shipped on `main` (captured before this skill ran), not the new version in `version.json`.
