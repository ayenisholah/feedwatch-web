# feedwatch-web: agent instructions

The Feedwatch browser client. Next.js 16 static export, React 19, Tailwind 4, and the Frox design system copied from LendLoop. TypeScript is used **only** here; all server work is Rust in the sibling repos (feedwatch-platform ADR 0002).

## Start of every session

1. Read [`docs/PROGRESS.md`](docs/PROGRESS.md). Its "Next step" says exactly what to do.
2. System rules live in `../feedwatch-platform`: `AGENTS.md`, `docs/ENGINEERING_STANDARDS.md`, `docs/TEST_STRATEGY.md`, `docs/REQUIREMENTS.md` and `docs/DATA_CONTRACT.md`. Follow them here.

## Commands

```sh
npm run check           # every gate CI runs, including the static build
npm run test:e2e        # Playwright on out/ (run npm run build first)
npm test                # Vitest only
npm run dev             # local dev server
```

## Rules that matter most here

- `output: "export"`: no server components that fetch at request time, no route handlers, no `next/headers`. Data is fetched in the browser from `/api/*`. Dynamic pages use query strings (`/feed?chain=base&id=ETH`).
- Validate every API response with Zod before use. Types come from the API's pinned `openapi.json` (M3 `feat/api-client`).
- Use the Frox semantic tokens and components in `components/ui/`, never raw hex values. To add a component, copy it from `/home/titan/projects/lendloop/components/ui/` with its test.
- Coverage: 100% per file in `app/` and `lib/`. `components/ui` has a lower floor (see `vitest.config.mts`) that rises as tests are added.
- Test names start with the requirement ID, such as `[FR-FW-7] shows the empty state`.
- Branch and pull request for every change. Commits are Conventional Commits with **no attribution lines**.
- Update `docs/PROGRESS.md` in the same commit as the work.
