import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA-ready — no dev-only origins in production
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
