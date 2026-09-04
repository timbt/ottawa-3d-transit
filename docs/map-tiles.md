# Map tile data

The basemap (roads, water, building footprints, admin boundaries, etc.) is
served from a local [PMTiles](https://protomaps.com/) archive at
`public/tiles/ottawa.pmtiles`, extracted from
[Protomaps](https://protomaps.com/)' daily global OpenStreetMap build. This
file is **not committed** — it's gitignored and cheap to regenerate, so
everyone just runs the fetch script instead of a multi-megabyte binary living
in git history.

## One-time setup: install the `pmtiles` CLI

The extract is done by the [go-pmtiles](https://github.com/protomaps/go-pmtiles)
CLI — not to be confused with the `pmtiles` npm package the app itself will
use to actually read this file in the browser; that's a separate,
JS-only reader library with no CLI of its own.

- **Prebuilt binary** (what this was set up with): grab the archive for your
  OS/architecture from the
  [releases page](https://github.com/protomaps/go-pmtiles/releases), extract
  it, and put the `pmtiles` binary somewhere on your `PATH`.
- **Or, with Go installed**: `go install github.com/protomaps/go-pmtiles@latest`

Confirm it worked:

```bash
pmtiles version
```

## Fetching / updating the tiles

```bash
./scripts/fetch-map-tiles.sh
```

This pulls today's (or, failing that, yesterday's) daily basemap build from
`build.protomaps.com` and extracts just the Ottawa-area bounding box and zoom
levels 0–14 — a few tens of MB, not the ~100+ GB planet file, since
`pmtiles extract` fetches only the byte ranges it needs over HTTP range
requests. Output goes to `public/tiles/ottawa.pmtiles`, overwriting whatever
was there.

Run it:

- **The first time**, before the map will show any real streets/water/etc. —
  it currently isn't wired into the MapLibre style yet, so having this file
  alone isn't enough on its own for anything to look different in the app.
- **Whenever you want to change the area or detail level** — edit the
  `BBOX` (`west,south,east,north`) or `MAX_ZOOM` variables at the top of
  [`scripts/fetch-map-tiles.sh`](../scripts/fetch-map-tiles.sh) and re-run.
- **Occasionally, to pick up fresher OpenStreetMap data** — there's no
  versioning here, it just grabs whatever Protomaps published most recently.

## Inspecting the result

```bash
pmtiles show public/tiles/ottawa.pmtiles           # metadata: bounds, zoom range, layers
pmtiles show --metadata public/tiles/ottawa.pmtiles # full JSON, including per-layer fields
```

Or drag the file onto [maps.protomaps.com](https://maps.protomaps.com) to view it visually.
