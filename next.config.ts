import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  // ffmpeg-static locates its binary relative to its own folder, so it must not be bundled,
  // and the binary has to be traced into the subtitles function.
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/subtitles": ["./node_modules/ffmpeg-static/ffmpeg*"],
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
