import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false,
  allowedDevOrigins: Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && !entry.internal && entry.family === "IPv4")
    .map((entry) => entry!.address),
};

export default nextConfig;
