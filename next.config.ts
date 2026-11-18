import type { NextConfig } from "next";

// Reloaded to recognize updated prisma schema in node_modules
const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Allow uploads up to 50MB through proxy.ts (default is 10MB). Matches nginx client_max_body_size.
    proxyClientMaxBodySize: "50mb",
  },
  async redirects() {
    return [
      { source: "/gallery", destination: "/posts", permanent: true },
      { source: "/project-member", destination: "/project-members", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/project-member", destination: "/project-members" },
      { source: "/project%20member", destination: "/project-members" },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    qualities: [75, 95],
  },
};

export default nextConfig;
