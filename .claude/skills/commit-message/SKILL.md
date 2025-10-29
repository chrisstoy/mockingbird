---
name: commit-message
description: Generate a git commit message for staged changes
---

# Git Commit Message Generator

Generate a well-formatted git commit message for the currently staged changes.

## Instructions

1. Run `git diff --cached` to see all staged changes
2. Run `git status` to see the list of staged files
3. Analyze the changes and determine:
   - The primary purpose of the changes (feature, fix, refactor, docs, etc.)
   - The key modifications made
   - Which files were affected

4. Generate a commit message with the following format:
   ```
   JIRA-ID: Short overview of the change

   - Primary change 1
   - Primary change 2
   - Primary change 3
   ```

5. Guidelines:
   - First line: JIRA ticket ID (e.g., "MOC-61") followed by a colon and short summary (50-72 chars total)
   - Leave a blank line after the first line
   - Bullet list of primary changes (focus on "what" changed, not implementation details)
   - Keep bullets concise and focused on user-facing or architectural changes
   - Group related changes together
   - Use present tense ("update", "add", "fix", not "updated", "added", "fixed")

6. If you cannot determine the JIRA ticket ID from the branch name or recent commits, use "MOC-XXX" as a placeholder and ask the user to provide the ticket ID.

7. Present the commit message to the user in a code block and ask if they want to:
   - Use it as-is
   - Make modifications
   - Create the commit automatically

## Example Output

```
MOC-61: Upgrade ESLint to v9

- Migrate from .eslintrc.json to flat config (eslint.config.js)
- Update ESLint and plugins to v9-compatible versions
- Remove deprecated .eslintignore file
- Update nx.json to reference new config format
```
