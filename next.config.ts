import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    "@google-cloud/vertexai",
    "google-auth-library",
    "spacetimedb",
  ],
};

export default nextConfig;
