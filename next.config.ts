import type { NextConfig } from "next";

/**
 * Unlike LFG — which serves every remote image through a plain <img> wrapper to
 * avoid maintaining remote patterns — FN3P is a merch brand, so product imagery
 * runs through next/image for resizing and format negotiation. That requires
 * allow-listing the two hosts we read from: Shopify's CDN and the Front9 API
 * origin (which serves blog feature images and event artwork).
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "api.front9.com" },
    ],
  },
};

export default nextConfig;
