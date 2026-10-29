import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Jawy",
    short_name: "Jawy",
    description: "Trending movies, new series and all-time favorites, ready to watch.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#110e1a",
    theme_color: "#110e1a",
    categories: ["entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the app icon to jump straight in.
    shortcuts: [
      { name: "My List", url: "/my-list", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Series", url: "/series", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Search", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
