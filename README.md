# feedwatch-web

[![CI](https://github.com/ayenisholah/feedwatch-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ayenisholah/feedwatch-web/actions/workflows/ci.yml) [![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE) [![Node 24](https://img.shields.io/badge/node-24-339933)](.nvmrc)

The Feedwatch browser client: a Next.js static export in the Frox design system, copied from LendLoop. It reads the Rust API under `/api` on the same origin. It has no server runtime (feedwatch-platform ADR 0002).

Part of [Feedwatch](https://github.com/ayenisholah/feedwatch-platform/blob/main/SPEC.md). System docs, the data contract and the roadmap live in `feedwatch-platform`.

> **Status:** scaffolded (M0). A placeholder home page with the theme switch. See [progress](docs/PROGRESS.md).

## Run

```sh
npm install
npm run dev              # http://localhost:3000
```

## Check

```sh
npm run check            # format, lint, types, duplicates, unused code, coverage, static build to out/
npm run test:e2e         # Playwright on out/, light and dark, with axe
```

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
