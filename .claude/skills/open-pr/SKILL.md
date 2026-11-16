---
name: open-pr
description: Verifies a branch, pushes it, opens a pull request and merges it once green. Use when a branch is ready.
---

# Open a pull request

1. **Tidy.** No `wip` or fixup commits. A force-push needs the owner's approval.
2. **Progress.** Confirm `docs/PROGRESS.md` is current and names the next step.
3. **Verify.** Run the repo's full check (`./scripts/check.sh` or `npm run check`). If it fails, don't push.
4. **Open.** Push the branch, then run `gh pr create`, filling in the template and listing the requirement IDs. Write the body only from results you've seen. Add no attribution.
5. **Wait.** Watch the checks on the current commit with `gh pr checks --watch`.
6. **Merge.** Once all checks pass, run `gh pr merge --rebase --delete-branch`.
7. **Confirm.** Check that CI passes on `main`, and update the platform repo's `docs/PROGRESS.md` if a milestone moved.
