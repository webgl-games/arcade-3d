// Plain-JS config: next.config.ts requires SWC transpilation at boot, which can
// try to DOWNLOAD platform binaries on a fresh server and slow down startup.
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A pnpm-lock.yaml in the home directory makes Next infer the wrong workspace
  // root, which breaks serving of public/ assets (e.g. /tiny-planet.html).
  // Pin the root to this project so static assets resolve correctly.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
