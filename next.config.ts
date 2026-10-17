import type { NextConfig } from "next";

if (process.env.VERCEL) {
  if (!process.env.NEXT_PUBLIC_API_URL?.startsWith("https://"))
    throw new Error(
      "Set NEXT_PUBLIC_API_URL to the deployed HTTPS backend URL ending in /api.",
    );
  if (process.env.NEXT_PUBLIC_DIRECT_UPLOADS !== "true")
    throw new Error(
      "Set NEXT_PUBLIC_DIRECT_UPLOADS=true for Vercel file uploads.",
    );
}

const nextConfig: NextConfig = {/* config options here */};

export default nextConfig;
