---
description: Commit and push all changes to current branch
---

# Commit and Push All Changes

Commit all staged and unstaged changes to the current branch and push to origin.

## Steps

1. Run `git status` to see all changes
2. Run `git diff --stat` to summarize what changed
3. Run `git log -3 --oneline` to see recent commit style
4. Stage all changes with `git add -A`
5. Create a descriptive commit message that:
   - Summarizes the changes made in this session
   - Uses conventional commit format (feat/fix/refactor/docs/chore)
   - Includes the Claude Code signature
6. Push to the current branch

**Do not ask for confirmation - just commit and push.**
