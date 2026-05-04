import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/*": ["./public/katalog/v1/**/*"],
  },
};

export default nextConfig;
