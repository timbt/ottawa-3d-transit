import { defineConfig } from "vitest/config";

// No jsdom/React plugin here on purpose — everything under test right now
// is plain TypeScript (src/lib/**), not rendered components. Add those back
// (see Next.js's own Vitest guide) if/when a component test is actually
// wanted; no reason to pay that setup cost speculatively.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
