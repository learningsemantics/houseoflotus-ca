import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
