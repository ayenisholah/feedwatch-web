# Progress

**Updated:** 2026-11-18

Read this first. Update it in the same commit as the work. The system-wide state is in `../feedwatch-platform/docs/PROGRESS.md`.

## Next step

Wait until the API serves data (M2) and publishes `openapi.json`. Then start branch `feat/api-client` (part of FR-FW-7):

- Add `zod` and `openapi-typescript`.
- Generate types from the pinned `openapi.json` into `lib/api/schema.ts`.
- Write `lib/api/client.ts`, which fetches `/api/*`, parses the response with Zod and returns a result.
- Write `lib/api/use-api.ts`, which polls every 30 s and exposes loading, empty, error and data states.
- Add a contract test that fails when the generated types differ from the pinned spec.

After that: `feat/overview` (StatWidgets, chain SegmentedControl, feed table), `feat/feed-detail`, `feat/compare-page` and `feat/incidents-page`.

## Done

| Date       | Work                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-18 | `ci/deploy-on-merge` (NFR-3): a `Deploy` workflow calls feedwatch-platform's reusable deploy workflow after `CI` passes on `main`, so every merge reaches production (platform ADR 0008). Needs the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets from platform `scripts/aws/set-deploy-secrets.sh`.                                                       |
| 2026-11-16 | Scaffold: Next.js 16 static export; Frox tokens, `cn`, theme and components (Alert, Badge, Button, Card, EmptyState, PageHeader, SegmentedControl, Spinner, StatWidget, ThemeToggle, trimmed icons) copied from LendLoop with their tests; placeholder home page; Vitest (28 tests), Playwright smoke in light and dark with axe; ESLint, Prettier, knip, jscpd; CI. |

## In progress

Nothing.

## Blocked

Nothing.

## Notes

- Copied component fixes for `noUncheckedIndexedAccess`: `SegmentedControl` guards its option and key lookups.
- Zod was removed for now, because knip fails on unused dependencies. Add it back in `feat/api-client`.
- Generate `package-lock.json` under Node 24 (`docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD:/app" -w /app node:24 npm install --package-lock-only`). A lockfile from a newer local Node leaves out optional entries, and `npm ci` fails in CI.
