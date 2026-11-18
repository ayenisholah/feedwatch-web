# feedwatch-web

[![CI](https://github.com/ayenisholah/feedwatch-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ayenisholah/feedwatch-web/actions/workflows/ci.yml) [![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE) [![Node 24](https://img.shields.io/badge/node-24-339933)](.nvmrc)

The Feedwatch browser client: a Next.js static export in the Frox design system, copied from LendLoop. It reads the Rust API under `/api` on the same origin. It has no server runtime (feedwatch-platform ADR 0002).

Part of [Feedwatch](https://github.com/ayenisholah/feedwatch-platform/blob/main/SPEC.md). System docs, the data contract and the roadmap live in `feedwatch-platform`.

> **Live:** https://feedwatch.sholaayeni.xyz. **Status:** M3 done: all four pages, deployed on every merge to `main`. See [progress](docs/PROGRESS.md).

## Pages

| Page      | Path                           | Shows                                                                                                                                                               |
| --------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview  | `/`                            | Every feed, worst first: status, value, last update, age against heartbeat, distance from the reference price. Chain and issue filters (kept in the URL) and search |
| Feed      | `/feed/?chain=ethereum&id=ETH` | One feed's latest reading, and 24 hours of value and age as accessible line charts (hover or arrow keys; "Show data" table)                                         |
| Compare   | `/compare/`                    | The feeds on Ethereum, Arbitrum and Base side by side, highest and lowest marked, with the spread                                                                   |
| Incidents | `/incidents/`                  | Open incidents or the last 30 days; incidents that happened together (an outage) are grouped                                                                        |

Every page has loading, empty and error states (with Try again), refreshes every 30 seconds while visible, works by keyboard, and passes axe in light and dark themes.

## How it reads the API

- `lib/api/openapi.json` is the pinned contract, feedwatch-api [v0.1.0](https://github.com/ayenisholah/feedwatch-api/releases/tag/v0.1.0). `lib/api/schema.ts` is generated from it (`npm run api:types`). To move to a new release, run `scripts/update-openapi.sh vX.Y.Z`, then fix what `npm run typecheck` reports.
- `lib/api/schemas.ts` validates every response with Zod. Compile-time checks keep each schema equal to its generated type.
- `lib/api/use-api.ts` fetches and polls; `components/feeds/DataState.tsx` renders its loading and error states.

## Run

```sh
npm install
npm run dev                                                   # http://localhost:3000, API on the same origin
NEXT_PUBLIC_API_BASE=http://localhost:8080 npm run dev        # against the local stack's API (feedwatch-platform compose.yaml)
```

The local API allows CORS from `http://localhost:3000`. Use Node 24 (`.nvmrc`); generate `package-lock.json` under Node 24, or `npm ci` fails in CI.

## Check

```sh
npm run check            # format, lint, types, duplicates, unused code, coverage, static build to out/
npm run test:e2e         # Playwright on out/ with /api stubbed from e2e/fixtures, light and dark, with axe
LIVE_URL=https://feedwatch.sholaayeni.xyz npx playwright test e2e/live.spec.ts   # the deployed site, real data
```

`e2e/fixtures/*.json` are real production responses. The contract tests also parse them.

## Design system

`app/globals.css` (tokens), `lib/cn.ts`, `lib/theme.ts` and `components/ui/*` come from LendLoop's Frox implementation, which is based on the `Frox_dashboard_v5` Figma file. Use the semantic tokens (`bg-surface`, `text-fg-muted`, `text-h4`), not raw hex values. To add a component, copy it from LendLoop's `components/ui/`, with its test.

## Feedwatch repositories

| Repo                                                                    | What it is                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [feedwatch-platform](https://github.com/ayenisholah/feedwatch-platform) | Specification, requirements, ADRs, data contract, Compose, Grafana, AWS deployment |
| [feedwatch-poller](https://github.com/ayenisholah/feedwatch-poller)     | Rust worker: reads every feed, runs the checks, writes to InfluxDB                 |
| [feedwatch-api](https://github.com/ayenisholah/feedwatch-api)           | Rust (Axum) read API over InfluxDB                                                 |
| [feedwatch-web](https://github.com/ayenisholah/feedwatch-web)           | Next.js static client in the Frox design system                                    |

## Licence

MIT
