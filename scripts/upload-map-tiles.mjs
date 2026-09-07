// Uploads the locally-built ottawa.pmtiles (see fetch-map-tiles.sh) to the
// Cloudflare R2 bucket the app actually serves tiles from — see
// docs/map-tiles.md. R2 exposes an S3-compatible API, so this is just the
// regular AWS SDK pointed at Cloudflare's endpoint instead of AWS's
// (region "auto" is what R2 expects here, not a real AWS region).
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BUCKET = "ottawa-3d-transit-tiles";
const KEY = "ottawa.pmtiles";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`error: missing env var(s): ${missing.join(", ")}`);
  console.error("Set these in .env.local — see .env.example / docs/map-tiles.md");
  process.exit(1);
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const filePath = join(root, "public", "tiles", "ottawa.pmtiles");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const body = await readFile(filePath);

await client.send(
  new PutObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    Body: body,
    ContentType: "application/octet-stream",
  }),
);

console.log(`uploaded ${filePath} (${body.length} bytes) to ${BUCKET}/${KEY}`);
