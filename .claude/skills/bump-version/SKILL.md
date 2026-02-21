---
name: bump-version
description: Bump version in version.json and update CHANGELOG with completed Jira tickets
---

# Bump Version Skill

Bump the application version and update the CHANGELOG.md with Jira tickets that have been completed and merged into develop since the last version.

## Process

1. **Find the last version tag**
   - List all version tags and identify the most recent one
   - Tags follow format `vX.Y.Z` (e.g., `v0.2.6`)
   - Command: `git tag | grep -E '^v[0-9]' | sort -V | tail -1`

2. **Read current version from version.json**
   - Read `apps/mockingbird/version.json` to see current version
   - This should match the last git tag (without the 'v' prefix)

3. **Determine next version number**
   - Ask the user what the next version number should be (e.g., 0.2.7)
   - Follow semantic versioning: MAJOR.MINOR.PATCH
   - Explain options:
     - PATCH (0.2.6 → 0.2.7): Bug fixes, small changes
     - MINOR (0.2.6 → 0.3.0): New features, backward compatible
     - MAJOR (0.2.6 → 1.0.0): Breaking changes

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
   - Insert new release section at the TOP of the file
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
- After running this skill, the user typically should:
  1. Commit the changes (version.json + CHANGELOG.md)
  2. Create a git tag for the new version (`git tag vX.Y.Z`)
  3. Push the tag to remote (`git push origin vX.Y.Z`)
