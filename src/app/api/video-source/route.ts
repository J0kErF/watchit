// src/app/api/video-source/route.ts
import { NextResponse } from "next/server";

/**
 * Server‑side endpoint that receives a Vidfast embed URL (the same URL the
 * original iframe would load) and returns the direct HLS manifest (`.m3u8`).
 *
 * The implementation follows the "Method 2" approach you described:
 *   1. Fetch the remote embed page.
 *   2. Look for a `file:` or `source:` field that contains an HTTPS URL ending
 *      with `.m3u8`.
 *   3. Return that URL as JSON.
 *
 * This endpoint is deliberately minimal – it does *not* proxy the stream. The
 * client component (`CleanCustomPlayer`) loads the manifest directly, which
 * works in the browser because the Vidfast host allows CORS for HLS playback.
 * If you encounter CORS issues later, you can extend this handler to proxy the
 * stream, but for most cases the manifest is publicly accessible.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const embedUrl = searchParams.get("url");

  if (!embedUrl) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  try {
    const response = await fetch(embedUrl, {
      headers: {
        // A generic user‑agent helps avoid some bot blocks.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch embed page (${response.status})` }, { status: 502 });
    }

    const html = await response.text();
    // Look for something like: source: "https://.../index.m3u8" or file: "...m3u8"
    const regex = /(file|source)\s*[:=]\s*["'](https:\/\/[^"']+\.m3u8[^"']*)["']/i;
    const match = html.match(regex);

    if (match && match[2]) {
      return NextResponse.json({ streamUrl: match[2] });
    }

    return NextResponse.json({ error: "HLS manifest not found in embed page" }, { status: 404 });
  } catch (err) {
    console.error("video-source error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
