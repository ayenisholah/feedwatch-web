# feedwatch-web

The Feedwatch browser client: a Next.js static export in the Frox design system, copied from LendLoop. It reads the Rust API under `/api` on the same origin. It has no server runtime (feedwatch-platform ADR 0002).

Part of [Feedwatch](../feedwatch-platform/SPEC.md). System docs, the data contract and the roadmap live in `feedwatch-platform`.

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

## Licence

MIT
