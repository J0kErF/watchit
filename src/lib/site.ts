/**
 * The site's public address, for the sitemap and share links: `SITE_URL` when set, otherwise the
 * Vercel production domain, otherwise the local dev server.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  "http://localhost:3000"
).replace(/\/$/, "");
