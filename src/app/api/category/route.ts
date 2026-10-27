import { categoryQuery, findCategory, findSub, PAGES_PER_BATCH, parseDecade, parseSort } from "@/lib/categories";
import { parseLang } from "@/lib/i18n";
import { parseKids } from "@/lib/kids";
import { getTmdbList } from "@/lib/tmdb";

// TMDb serves at most 500 pages of /discover.
const MAX_BATCH = Math.floor(500 / PAGES_PER_BATCH);

/** One Load more batch of a category page: ?kind=movie|series&slug=&sub=&sort=&decade=&kids=1&batch=2 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const category = (kind === "movie" || kind === "series") && findCategory(kind, searchParams.get("slug") ?? "");
  const batch = Number(searchParams.get("batch"));
  if (!category || !Number.isInteger(batch) || batch < 2 || batch > MAX_BATCH) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const { path, params } = categoryQuery(
    kind,
    category,
    parseSort(searchParams.get("sort")),
    parseDecade(searchParams.get("decade")),
    findSub(category, searchParams.get("sub")),
    parseKids(searchParams.get("kids")),
  );
  const lang = parseLang(searchParams.get("lang"));
  const results = await getTmdbList(path, params, PAGES_PER_BATCH, (batch - 1) * PAGES_PER_BATCH + 1, lang);
  return Response.json({ results }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
