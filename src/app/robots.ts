import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The player, the APIs and the admin portal aren't pages to list.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/watch/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
