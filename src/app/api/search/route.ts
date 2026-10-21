import { searchTitles } from "@/lib/archive";
import type { Kind } from "@/lib/types";

const TYPES = new Set(["all", "movie", "series"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 100);
  const typeParam = searchParams.get("type") ?? "all";
  const type = (TYPES.has(typeParam) ? typeParam : "all") as Kind | "all";

  try {
    const results = await searchTitles(q, type);
    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json({ results: [], error: "Search is unavailable right now." }, { status: 502 });
  }
}
