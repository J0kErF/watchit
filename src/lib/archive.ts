import { cacheLife } from "next/cache";
import { CATALOG, catalogEntry } from "./catalog";
import type { Episode, Kind, TitleDetail, TitleSummary } from "./types";

const IA = "https://archive.org";
const ID_PATTERN = /^[A-Za-z0-9._-]{1,120}$/;

// Browser-playable derivatives, best first. Archive-made "h.264 IA" files are always H.264.
const FORMAT_RANK = ["h.264 IA", "h.264", "MPEG4", "512Kb MPEG4"];

// Archive's license flags are set by uploaders and are sometimes wrong (copyrighted films
// marked public domain). By default only the hand-checked CATALOG is searchable and playable;
// set ARCHIVE_OPEN_SEARCH=true to also include Archive's feature_films collection.
const OPEN_SEARCH = process.env.ARCHIVE_OPEN_SEARCH === "true";

// Open search results also get a light content filter.
const SEARCH_EXCLUDE = "-subject:(sex OR sexploitation OR nudist OR nudity OR erotic OR exploitation)";

export const posterUrl = (id: string) => `${IA}/services/img/${encodeURIComponent(id)}`;

const fileUrl = (id: string, name: string) =>
  `${IA}/download/${encodeURIComponent(id)}/${name.split("/").map(encodeURIComponent).join("/")}`;

export const isValidId = (id: string) => ID_PATTERN.test(id);

// The search API returns some fields (like year) as numbers.
type Field = string | number | (string | number)[] | undefined;

const first = (v: Field): string | undefined => {
  const value = Array.isArray(v) ? v[0] : v;
  return value === undefined || value === null ? undefined : String(value);
};

function cleanText(v: Field): string {
  const raw = Array.isArray(v) ? v.join("\n") : String(v ?? "");
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/You can find more information regarding this film on its IMDb page\s*\.?/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseYear(year: Field, date: Field): number | undefined {
  const m = (first(year) ?? first(date) ?? "").match(/\d{4}/);
  return m ? Number(m[0]) : undefined;
}

function cleanTitle(t: Field, id: string): string {
  return (first(t) ?? id).replace(/\s+\(\d{4}\)$/, "").trim();
}

interface SearchDoc {
  identifier: string;
  title?: Field;
  year?: Field;
  date?: Field;
  description?: Field;
  runtime?: Field;
  collection?: Field;
}

async function advancedSearch(q: string, rows: number, sort = "downloads desc"): Promise<SearchDoc[]> {
  const params = new URLSearchParams({ q, rows: String(rows), output: "json" });
  for (const f of ["identifier", "title", "year", "date", "description", "runtime", "collection"]) {
    params.append("fl[]", f);
  }
  params.append("sort[]", sort);
  const res = await fetch(`${IA}/advancedsearch.php?${params}`);
  if (!res.ok) throw new Error(`Archive search failed: ${res.status}`);
  const data = (await res.json()) as { response?: { docs?: SearchDoc[] } };
  return data.response?.docs ?? [];
}

function toSummary(doc: SearchDoc, kind: Kind, genres: string[], title?: string): TitleSummary {
  return {
    id: doc.identifier,
    kind,
    title: title ?? cleanTitle(doc.title, doc.identifier),
    year: parseYear(doc.year, doc.date),
    description: cleanText(doc.description),
    poster: posterUrl(doc.identifier),
    genres,
    runtime: first(doc.runtime),
  };
}

/** Card data for every catalog entry, fetched in a single search request. */
export async function getCatalog(): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("days");

  const q = `identifier:(${CATALOG.map((e) => `"${e.id}"`).join(" OR ")})`;
  const docs = await advancedSearch(q, CATALOG.length);
  const byId = new Map(docs.map((d) => [d.identifier, d]));
  return CATALOG.flatMap((e) => {
    const doc = byId.get(e.id);
    return doc ? [toSummary(doc, e.kind, e.genres, e.title)] : [];
  });
}

export async function searchTitles(query: string, type: Kind | "all" = "all"): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("hours");

  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const catalog = await getCatalog();
  const local = catalog.filter(
    (t) =>
      (type === "all" || t.kind === type) &&
      (t.title.toLowerCase().includes(needle) || t.genres.some((g) => g.toLowerCase() === needle)),
  );
  if (type === "series" || !OPEN_SEARCH) return local;

  // Beyond the catalog, search Archive's feature film collection for public-domain movies.
  const terms = needle.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ").trim();
  let remote: TitleSummary[] = [];
  if (terms) {
    const q = `collection:feature_films AND mediatype:movies AND licenseurl:*publicdomain* AND title:(${terms}) ${SEARCH_EXCLUDE}`;
    try {
      remote = (await advancedSearch(q, 36)).map((d) => toSummary(d, "movie", []));
    } catch {
      remote = [];
    }
  }
  const seen = new Set(local.map((t) => t.id));
  return [...local, ...remote.filter((t) => !seen.has(t.id))];
}

interface ArchiveFile {
  name: string;
  format?: string;
  length?: string;
  size?: string;
  title?: string;
}

interface MetadataResponse {
  metadata?: Record<string, Field>;
  files?: ArchiveFile[];
}

function toSeconds(length?: string): number | undefined {
  if (!length) return undefined;
  if (length.includes(":")) {
    return length.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
  }
  const n = Number(length);
  return Number.isFinite(n) ? n : undefined;
}

function episodeLabel(file: ArchiveFile, base: string) {
  const name = base.split("/").pop() ?? base;
  const se = name.match(/s(\d{1,2})\s*e(\d{1,3})/i);
  let title = file.title?.trim() || name;
  if (!file.title) {
    title = title
      .replace(/[_]+/g, " ")
      .replace(/^.*?s\d{1,2}\s*e\d{1,3}\s*[-_ ]*/i, "")
      // "Ep03-560101MarcoPolo" (episode number + air date)
      .replace(/^(ep|episode)\s*\d+\s*[-_ ]*(\d{6}\s*)?/i, "")
      // "Sherlock Holmes 01 The Case of…" (series name + episode number)
      .replace(/^\D*?\b\d{1,3}\s+(?=\S)/, "")
      .replace(/^[-–\s]+/, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();
    if (/^[A-Z0-9\s'!?,.-]+$/.test(title)) {
      title = title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return {
    title: title || (se ? `Season ${Number(se[1])}, Episode ${Number(se[2])}` : name),
    season: se ? Number(se[1]) : undefined,
    number: se ? Number(se[2]) : undefined,
  };
}

/** Collapse the original + derivative copies of each video into one playable file. */
function videoGroups(id: string, files: ArchiveFile[]) {
  const groups = new Map<string, ArchiveFile[]>();
  for (const f of files) {
    if (!f.format || !FORMAT_RANK.includes(f.format) || !/\.mp4$/i.test(f.name)) continue;
    const key = f.name.replace(/\.mp4$/i, "").replace(/(\.ia|_512kb)$/i, "");
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.entries()]
    .map(([base, variants]) => {
      const [best, ...rest] = [...variants].sort(
        (a, b) => FORMAT_RANK.indexOf(a.format!) - FORMAT_RANK.indexOf(b.format!),
      );
      const duration = toSeconds(best.length) ?? Math.max(0, ...variants.map((v) => toSeconds(v.length) ?? 0));
      return {
        base,
        file: best,
        duration,
        size: Number(best.size ?? 0),
        src: fileUrl(id, best.name),
        fallbacks: rest.map((f) => fileUrl(id, f.name)),
      };
    })
    .filter((g) => !g.duration || g.duration >= 60);
}

export async function getTitle(id: string): Promise<TitleDetail | null> {
  "use cache";
  cacheLife("days");

  if (!isValidId(id)) return null;
  const entry = catalogEntry(id);
  const res = await fetch(`${IA}/metadata/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as MetadataResponse;
  const meta = data.metadata;
  const files = data.files ?? [];
  if (!meta || meta.mediatype !== "movies") return null;

  // Only stream items marked public domain or Creative Commons.
  const license = first(meta.licenseurl);
  if (!license || !/publicdomain|creativecommons/.test(license)) return null;

  const collections = ([] as (string | number)[]).concat(meta.collection ?? []).map(String);
  if (!entry && !(OPEN_SEARCH && collections.includes("feature_films"))) return null;

  const groups = videoGroups(id, files);
  if (groups.length === 0) return null;

  const kind: Kind = entry?.kind ?? (collections.includes("classic_tv") && groups.length > 1 ? "series" : "movie");

  let episodes: Episode[];
  if (kind === "series") {
    episodes = groups
      .sort((a, b) => a.base.localeCompare(b.base, undefined, { numeric: true, sensitivity: "base" }))
      .map((g, index) => {
        const label = episodeLabel(g.file, g.base);
        const title = entry?.episodeTitles?.[index] ?? label.title;
        return { index, ...label, title, duration: g.duration, src: g.src, fallbacks: g.fallbacks };
      });
  } else {
    // A movie item can hold trailers, parts or several encodes: take the full-length one with the smallest file.
    const longest = Math.max(...groups.map((g) => g.duration ?? 0));
    const main = groups
      .filter((g) => (g.duration ?? 0) >= longest * 0.9)
      .sort((a, b) => Number(b.base === id) - Number(a.base === id) || (a.size || Infinity) - (b.size || Infinity))[0];
    episodes = [
      { index: 0, title: entry?.title ?? cleanTitle(meta.title, id), duration: main.duration, src: main.src, fallbacks: main.fallbacks },
    ];
  }

  const thumbs = files.filter((f) => f.format === "Thumbnail" && f.name.includes(".thumbs/"));
  const backdrop = thumbs.length > 2 ? fileUrl(id, thumbs[Math.floor(thumbs.length / 3)].name) : posterUrl(id);

  return {
    id,
    kind,
    title: entry?.title ?? cleanTitle(meta.title, id),
    year: parseYear(meta.year, meta.date),
    description: cleanText(meta.description),
    poster: posterUrl(id),
    genres: entry?.genres ?? [],
    runtime: first(meta.runtime),
    backdrop,
    license,
    creator: first(meta.creator),
    episodes,
  };
}

export function licenseLabel(url?: string) {
  if (!url) return "Public domain";
  if (url.includes("publicdomain/zero")) return "CC0";
  if (url.includes("publicdomain")) return "Public domain";
  const m = url.match(/licenses\/([a-z-]+)\/([\d.]+)/);
  return m ? `CC ${m[1].toUpperCase()} ${m[2]}` : "Creative Commons";
}
