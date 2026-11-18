#!/usr/bin/env bash
# Pins a released feedwatch-api contract: downloads its openapi.json and regenerates lib/api/schema.ts.
# Usage: scripts/update-openapi.sh v0.2.0. Then fix whatever `npm run typecheck` flags in
# lib/api/schemas.ts, and update docs/PROGRESS.md with the new version.
set -euo pipefail
cd "$(dirname "$0")/.."
version=${1:?usage: scripts/update-openapi.sh vX.Y.Z}
gh release download "$version" --repo ayenisholah/feedwatch-api --pattern openapi.json --dir lib/api --clobber
npm run api:types
echo "Pinned feedwatch-api $version"
