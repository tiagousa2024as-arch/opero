import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@opero/ui", "@opero/auth", "@opero/database", "@opero/notifications"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // Needed for a correct standalone trace in a pnpm monorepo — without
    // it Next traces from apps/web only and misses workspace packages'
    // real files behind pnpm's symlinks.
    outputFileTracingRoot: path.join(__dirname, "../../"),
    // Prisma's query engine binary is loaded via a runtime-computed
    // require() (built from process.platform), which static tracing
    // (@vercel/nft) can't follow — a known gap, not specific to this
    // repo. This glob force-includes it in the standalone output.
    // VERIFY on the first real deploy: if the container fails to find
    // libquery_engine-*.so.node at startup, this glob needs adjusting.
    outputFileTracingIncludes: {
      "/*": ["../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/*.node"],
    },
  },
};

export default nextConfig;
