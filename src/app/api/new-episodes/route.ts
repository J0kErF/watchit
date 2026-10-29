import { getLastAired } from "@/lib/tmdb";
import { TITLE_ID_PATTERN } from "@/lib/types";

const MAX_IDS = 60;

/** Latest aired episode dates for series: ?ids=tmdb-tv-1,tmdb-tv-2 → { "tmdb-tv-1": "2026-10-20" } */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => TITLE_ID_PATTERN.test(id) && id.startsWith("tmdb-tv-"))
    .slice(0, MAX_IDS);
  const dates = await Promise.all(ids.map((id) => getLastAired(id)));
  const aired = Object.fromEntries(ids.flatMap((id, i) => (dates[i] ? [[id, dates[i]]] : [])));
  return Response.json(aired, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
}
