#!/usr/bin/env bash
# Generates the tiny PMTiles fixture the Playwright smoke test (e2e/) loads
# the app against, instead of the real ottawa.pmtiles — see
# scripts/fetch-map-tiles.sh for that one. Unlike that file, this fixture
# IS committed to git: it's small (~2MB) and needs to exist in CI without
# any network access to Protomaps or R2 at test time.
#
# Covers src/components/Map.tsx's DEFAULT_VIEW_STATE coordinate with a small
# margin, so the smoke test exercises real building/road/water geometry
# rather than an empty viewport — not meant to look like a useful map on its
# own, just enough real data for a handful of city blocks.
#
# Rarely needs re-running — only if the Protomaps basemap schema changes in
# a way that breaks the smoke test, or the fixture's coverage needs
# adjusting. Requires the `pmtiles` CLI on PATH — see docs/map-tiles.md.
set -euo pipefail

if ! command -v pmtiles >/dev/null 2>&1; then
  echo "error: 'pmtiles' CLI not found on PATH." >&2
  echo "Install it from https://github.com/protomaps/go-pmtiles/releases" >&2
  exit 1
fi

BBOX="-75.71,45.41,-75.69,45.43"
MAX_ZOOM=14

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="$root/e2e/fixtures"
out_file="$out_dir/test-tile.pmtiles"
mkdir -p "$out_dir"

today="$(date -u +%Y%m%d)"
yesterday="$(date -u -d 'yesterday' +%Y%m%d 2>/dev/null || date -u -v-1d +%Y%m%d)"

source_url=""
for d in "$today" "$yesterday"; do
  candidate="https://build.protomaps.com/${d}.pmtiles"
  if curl -sfI "$candidate" >/dev/null; then
    source_url="$candidate"
    break
  fi
done

if [ -z "$source_url" ]; then
  echo "error: couldn't find a recent daily build at build.protomaps.com for $today or $yesterday" >&2
  exit 1
fi

echo "extracting fixture from $source_url"
rm -f "$out_file"
pmtiles extract "$source_url" "$out_file" \
  --bbox="$BBOX" --minzoom=0 --maxzoom="$MAX_ZOOM"

echo "wrote $out_file"
pmtiles show "$out_file"
