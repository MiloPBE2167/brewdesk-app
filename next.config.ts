import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    browserToTerminal: true,
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  cacheComponents: true,
  reactCompiler: false,
};

export default nextConfig;
 