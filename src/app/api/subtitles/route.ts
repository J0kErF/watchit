import { getTitle } from "@/lib/archive";
import { normalizeLanguage } from "@/lib/languages";
import { CHUNK_SECONDS, errorCode, getSubtitles } from "@/lib/subtitles";

const STATUS = { not_found: 404, unsupported: 422, audio_failed: 502, billing_required: 503, failed: 500 } as const;

const MESSAGES = {
  not_found: "That title or episode doesn't exist.",
  unsupported: "Subtitles aren't available for silent films.",
  audio_failed: "Couldn't read the audio for this part of the video.",
  billing_required: "AI subtitles turn on once AI Gateway billing is enabled for this site.",
  failed: "Couldn't generate subtitles right now.",
} as const;

const error = (code: keyof typeof STATUS) =>
  Response.json({ error: code, message: MESSAGES[code] }, { status: STATUS[code], headers: { "Cache-Control": "no-store" } });

/** GET /api/subtitles?id=<archive id>&ep=<episode index>&chunk=<30s window index>&lang=<BCP-47 code | original> */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const ep = Number(params.get("ep") ?? 0);
  const chunk = Number(params.get("chunk"));
  const lang = normalizeLanguage(params.get("lang") ?? "");

  if (!lang || !Number.isInteger(ep) || ep < 0 || !Number.isInteger(chunk) || chunk < 0) {
    return Response.json({ error: "bad_request", message: "Invalid id, ep, chunk or lang." }, { status: 400 });
  }

  // Only titles WatchIt itself serves, and only windows inside the video.
  const title = await getTitle(id);
  const episode = title?.episodes[ep];
  if (!title || !episode) return error("not_found");
  if (title.genres.includes("Silent")) return error("unsupported");
  if (episode.duration && chunk * CHUNK_SECONDS >= episode.duration) return Response.json({ cues: [] });

  try {
    const cues = await getSubtitles(title.id, ep, chunk, lang);
    return Response.json(
      { cues },
      { headers: { "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=31536000" } },
    );
  } catch (err) {
    const code = errorCode(err);
    console.error(`[subtitles] ${id} ep${ep} chunk${chunk} ${lang}:`, err instanceof Error ? err.message : err);
    return error(code);
  }
}
