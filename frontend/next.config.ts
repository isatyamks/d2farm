import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove dev-only origins for production
  // API URL is injected at build time via NEXT_PUBLIC_API_URL env var
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};

export default nextConfig;
