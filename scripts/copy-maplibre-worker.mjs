// maplibre-gl's worker script (maplibre-gl-worker.mjs) imports a sibling
// chunk (maplibre-gl-shared.mjs) via a *relative* ESM specifier. Turbopack's
// `new URL(literal, import.meta.url)` asset pattern only emits the one file
// it's pointed at — it doesn't follow that file's own imports — so the
// worker 404s on its sibling as soon as it starts. Sidestep bundling
// entirely: copy both files, verbatim and side by side, into public/ so
// Next.js serves them unprocessed at a fixed path and the relative import
// between them resolves correctly. Re-run automatically via postinstall so
// this stays in sync whenever maplibre-gl is (re)installed or upgraded.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "node_modules", "maplibre-gl", "dist");
const dest = join(root, "public", "maplibre-gl");

mkdirSync(dest, { recursive: true });

const files = [
  "maplibre-gl-worker.mjs",
  "maplibre-gl-worker.mjs.map",
  "maplibre-gl-shared.mjs",
  "maplibre-gl-shared.mjs.map",
];

for (const file of files) {
  copyFileSync(join(src, file), join(dest, file));
}

console.log(`copied ${files.length} maplibre-gl worker files to public/maplibre-gl/`);
