import { parseLang } from "@/lib/i18n";
import { parseKids } from "@/lib/kids";
import { searchTmdb } from "@/lib/tmdb";
import type { Kind } from "@/lib/types";

const TYPES = new Set(["all", "movie", "series"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 100);
  const typeParam = searchParams.get("type") ?? "all";
  const type = (TYPES.has(typeParam) ? typeParam : "all") as Kind | "all";

  // The language is in the URL, not read from the cookie, so shared caches keep languages apart.
  const results = await searchTmdb(q, type, parseLang(searchParams.get("lang")));
  // Kids mode keeps family titles only.
  const shown = parseKids(searchParams.get("kids")) ? results.filter((r) => r.family) : results;
  return Response.json({ results: shown }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
