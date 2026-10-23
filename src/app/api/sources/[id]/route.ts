import type { NextRequest } from "next/server";
import { getSources } from "@/lib/sources";
import { getTitle } from "@/lib/titles";

/** Direct sources for one episode of a title: /api/sources/tmdb-tv-1399?ep=3 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/sources/[id]">) {
  const { id } = await ctx.params;
  const title = await getTitle(id);
  const episode = title?.episodes[Number(request.nextUrl.searchParams.get("ep")) || 0];
  if (!title || !episode) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await getSources(title.id, episode), { headers: { "Cache-Control": "private, no-store" } });
}
