import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove dev-only origins for production
  // API URL is injected at build time via NEXT_PUBLIC_API_URL env var
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/webpack-hmr",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*'
      }
    ];
  },
  allowedDevOrigins: ['172.23.64.1', 'untransplanted-juli-dendrological.ngrok-free.dev'],
};

export default nextConfig;
