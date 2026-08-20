import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  experimental: {
    proxyClientMaxBodySize: "512mb",
  },
};

export default nextConfig;
