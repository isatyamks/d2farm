import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Turbopack HMR websockets to connect originating from local IPs natively
  allowedDevOrigins: ["localhost", "127.0.0.1", "172.23.64.1"],
};

export default nextConfig;
