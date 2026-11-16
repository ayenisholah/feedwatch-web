---
name: feature-slice
description: Builds one feature end to end, from a requirement ID to a pull request. Use when starting any roadmap branch in this repo.
---

# Feature slice

1. **Resume.** Read this repo's `docs/PROGRESS.md`. Then find the requirement in `../feedwatch-platform/docs/REQUIREMENTS.md`, and its branch in `../feedwatch-platform/docs/ROADMAP.md`. Restate the acceptance check. If the work has no requirement ID, ask first.
2. **Branch.** Run `git switch main && git pull --ff-only`, then create the branch named in the roadmap. Never work on `main`.
3. **Facts.** Before relying on any external interface (RPC, RedStone, InfluxDB, AWS), check `../feedwatch-platform/docs/VERIFIED_FACTS.md`. If it isn't there, test it and add it.
4. **Contract.** If the change touches stored data or the API, read `../feedwatch-platform/docs/DATA_CONTRACT.md`. Change the contract first, in the platform repo.
5. **Failing test.** Write a test named after the requirement ID that captures the acceptance check, and watch it fail for the right reason.
6. **Implement.** Make the smallest change that passes. Keep pure logic apart from I/O, and inject dependencies.
7. **Cover.** Add the tests each level needs (`../feedwatch-platform/docs/TEST_STRATEGY.md`). Run the repo's full check.
8. **Docs.** Update docs and ADRs if behaviour or decisions changed.
9. **Progress.** Update `docs/PROGRESS.md` in the same commit as the work. Set "Next step" to the exact next task.
10. **Ship.** Use `atomic-commit`, then `open-pr`.
