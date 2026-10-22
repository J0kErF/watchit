import { getTitle } from "@/lib/titles";

export async function GET(_request: Request, ctx: RouteContext<"/api/title/[id]">) {
  const { id } = await ctx.params;
  const title = await getTitle(id);
  if (!title) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(title, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
