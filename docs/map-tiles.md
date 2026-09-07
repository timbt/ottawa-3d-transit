# Map tile data

The basemap (roads, water, building footprints, admin boundaries, etc.) comes
from a [PMTiles](https://protomaps.com/) archive (`ottawa.pmtiles`) extracted
from [Protomaps](https://protomaps.com/)' daily global OpenStreetMap build.
It's built locally by a script, then uploaded to a Cloudflare R2 bucket,
which is what the running app actually fetches tiles from
(`NEXT_PUBLIC_TILES_BASE_URL` — see [Hosting on Cloudflare R2](#hosting-on-cloudflare-r2)).
The file itself is **not committed** — it's gitignored and cheap to
regenerate/re-upload, so nobody's stuck with a multi-megabyte binary living
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

If `.env.local` exists, this also uploads the result to R2 (see below) —
skipped, not failed, if it's missing, so the local file is still useful on
its own for inspection even without R2 set up.

Run it:

- **The first time**, before the map will show any real streets/water/etc.
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

## Hosting on Cloudflare R2

The app reads tiles from a public R2 bucket (`ottawa-3d-transit-tiles`), not
from `public/tiles/` — that local copy is only a staging area for the upload
and for the inspection commands above. R2 was picked over just committing
the file or serving it from `public/` because it's free at this scale (well
within R2's free tier: 10GB storage, 10M reads/month), has no git-history
bloat from a periodically-regenerated binary, and decouples tile hosting
from wherever the app itself ends up deployed.

**One-time bucket setup** (dashboard, already done for this project — notes
here for setting it up fresh elsewhere):

1. Create an R2 bucket and enable its **Public Development URL** (Settings →
   the free `pub-....r2.dev` domain — fine for now; a custom domain is a
   later, optional step for production-grade WAF/rate-limiting).
2. Set a CORS policy on the bucket (Settings → CORS Policy) — pmtiles' fetch
   logic needs `Range` allowed and `ETag`/`Content-Length`/`Content-Range`
   exposed, or its retry/validation logic silently gets `null` back:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["Range"],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. Create a bucket-scoped API token (R2 → Manage API Tokens, Object Read &
   Write, restricted to this one bucket) for the upload script's
   credentials.

**Environment variables** (see `.env.example`): `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (upload script only — the running
app never sees these) and `NEXT_PUBLIC_TILES_BASE_URL` (the bucket's public
URL — the app reads this one at build time).

**Uploading** normally just happens as the last step of
`fetch-map-tiles.sh`. To push the current local file without re-extracting:

```bash
node --env-file=.env.local scripts/upload-map-tiles.mjs
```

It's a plain S3-compatible upload (`@aws-sdk/client-s3` pointed at R2's
endpoint, `region: "auto"`) — R2 exposes an S3-compatible API, so any S3
tooling works here, not just this script.

**Cost note:** R2 has no hard spending cap — Cloudflare's budget/usage
alerts are informational-only (they email you, they don't pause anything).
Realistically not a concern at this project's scale: overage pricing is
$0.36 per *million* extra read requests, so even a bad month would need
tens of millions of unexpected requests to add up to real money. Budget
alerts are still worth setting up (Cloudflare dashboard → Billing) as a
cheap tripwire.
