import type { NextConfig } from "next";

// Static export: the client has no server runtime (feedwatch-platform ADR 0002).
// CloudFront serves out/ from S3 and sends /api/* to the Rust API on the same origin.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
