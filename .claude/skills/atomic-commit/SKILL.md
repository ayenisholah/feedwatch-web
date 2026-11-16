---
name: atomic-commit
description: Splits working-tree changes into single-purpose Conventional Commits. Use before any commit in this repo.
---

# Atomic commit

1. Confirm you're on a feature branch, not `main`.
2. Read the whole diff with `git status` and `git diff`.
3. Group changes by purpose: one behaviour, fix or refactor per commit. Keep tests with the code they cover.
4. Stage only that group, using explicit paths. Never use `git add -A` blindly.
5. Order commits so each one builds and passes tests on its own.
6. Message format: `type(scope): imperative summary`, lower case, no trailing period. Hooks reject filler such as `wip` or `update`, and schedule labels.
7. Add no attribution lines: no `Co-Authored-By`, and no "generated with". commitlint rejects them.
8. If a hook fails, fix the cause. Never bypass it.
