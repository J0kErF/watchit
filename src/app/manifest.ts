import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jawy",
    short_name: "Jawy",
    description: "Trending movies, new series and all-time favorites, ready to watch.",
    start_url: "/",
    display: "standalone",
    background_color: "#110e1a",
    theme_color: "#110e1a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
