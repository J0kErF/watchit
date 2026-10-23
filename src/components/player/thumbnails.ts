/** A timeline preview image: an image URL and, for sprite sheets, the region of it to show. */
export interface Thumbnail {
  start: number;
  end: number;
  url: string;
  rect?: { x: number; y: number; w: number; h: number };
}

const toSeconds = (stamp: string) =>
  stamp
    .trim()
    .split(":")
    .reduce((total, part) => total * 60 + Number(part.replace(",", ".")), 0);

/** Parses a WebVTT thumbnails file, whose cues are image URLs, optionally ending in #xywh=x,y,w,h. */
export function parseThumbnails(vtt: string, base: string): Thumbnail[] {
  const lines = vtt.replace(/\r/g, "").split("\n");
  const thumbs: Thumbnail[] = [];
  for (let i = 0; i < lines.length; i++) {
    const timing = /^\s*([\d:.,]+)\s*-->\s*([\d:.,]+)/.exec(lines[i]);
    const target = lines[i + 1]?.trim();
    if (!timing || !target) continue;
    let url: URL;
    try {
      url = new URL(target, base);
    } catch {
      continue;
    }
    const xywh = /#xywh=(\d+),(\d+),(\d+),(\d+)$/.exec(url.hash);
    url.hash = "";
    thumbs.push({
      start: toSeconds(timing[1]),
      end: toSeconds(timing[2]),
      url: url.href,
      rect: xywh ? { x: +xywh[1], y: +xywh[2], w: +xywh[3], h: +xywh[4] } : undefined,
    });
    i++;
  }
  return thumbs;
}

export const thumbnailAt = (thumbs: Thumbnail[], time: number) => thumbs.find((t) => time >= t.start && time < t.end);
