// Copies the tiny committed test fixture (see scripts/generate-test-fixture.sh)
// to the path Map.tsx falls back to when NEXT_PUBLIC_TILES_BASE_URL is
// unset, so the Playwright smoke test (e2e/) has real tile data to load
// against without touching Protomaps or R2. Run before building/starting
// the server under test — see playwright.config.ts's webServer.command.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "e2e", "fixtures", "test-tile.pmtiles");
const destDir = join(root, "public", "tiles");
const dest = join(destDir, "ottawa.pmtiles");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);

console.log(`copied ${src} -> ${dest}`);
