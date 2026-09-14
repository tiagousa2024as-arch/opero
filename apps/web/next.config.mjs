/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@opero/ui", "@opero/auth", "@opero/database"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
