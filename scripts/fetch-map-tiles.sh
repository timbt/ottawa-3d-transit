#!/usr/bin/env bash
# Extracts an Ottawa-region PMTiles basemap archive from Protomaps' daily
# global OSM build, without downloading the whole (100+ GB) planet file —
# `pmtiles extract` only pulls the byte ranges covering our bounding box via
# HTTP range requests.
#
# Requires the `pmtiles` CLI on PATH. See docs/map-tiles.md for how to get
# it and more on what this script does and when to re-run it.
set -euo pipefail

if ! command -v pmtiles >/dev/null 2>&1; then
  echo "error: 'pmtiles' CLI not found on PATH." >&2
  echo "Install it from https://github.com/protomaps/go-pmtiles/releases" >&2
  exit 1
fi

# Ottawa + Gatineau + rural margin (covers the full City of Ottawa municipal
# boundary and enough of the Quebec side to show the Ottawa River / ON-QC
# border in context). west,south,east,north.
BBOX="-76.3,45.0,-75.2,45.7"
MAX_ZOOM=14

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="$root/public/tiles"
out_file="$out_dir/ottawa.pmtiles"
mkdir -p "$out_dir"

# Daily builds are published as https://build.protomaps.com/<YYYYMMDD>.pmtiles
# with no stable "latest" alias. Try today, then fall back a day in case
# today's hasn't landed yet.
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

echo "extracting from $source_url"
rm -f "$out_file" # not required (extract happily overwrites) but keeps re-runs clean
pmtiles extract "$source_url" "$out_file" \
  --bbox="$BBOX" --minzoom=0 --maxzoom="$MAX_ZOOM"

echo "wrote $out_file"
pmtiles show "$out_file"

# Push it to the R2 bucket the app actually serves tiles from (see
# docs/map-tiles.md) — skipped, not failed, if R2 credentials aren't set up
# yet, since the local file alone is still useful for inspection.
env_file="$root/.env.local"
if [ -f "$env_file" ]; then
  echo "uploading to R2..."
  node --env-file="$env_file" "$root/scripts/upload-map-tiles.mjs"
else
  echo "skipping R2 upload: no .env.local found (see .env.example)"
fi
