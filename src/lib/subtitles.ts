import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { getCache } from "@vercel/functions";
import { generateText, Output, transcribe } from "ai";
import { z } from "zod";
import { getTitle } from "./archive";
import { languageName, ORIGINAL } from "./languages";

/** Subtitles are generated in fixed windows so every viewer shares the same cached chunks. */
export const CHUNK_SECONDS = 30;
// Extra audio on each side so words at a chunk edge aren't cut off.
const PAD_SECONDS = 1;

const TRANSCRIBE_MODEL = "openai/whisper-1";
const TRANSLATE_MODEL = "google/gemini-3.5-flash-lite";

// Whisper tends to invent these over music and silence.
const HALLUCINATIONS = /^(thank you( so much)? for watching|thanks for watching|subtitles? by|subscribe|please subscribe|you|\.+|♪+)[.!]*$/i;

export interface Cue {
  start: number;
  end: number;
  text: string;
}

export type SubtitleErrorCode = "not_found" | "unsupported" | "audio_failed" | "billing_required" | "failed";

const fail = (code: SubtitleErrorCode, detail = ""): never => {
  throw new Error(`${code}: ${detail}`);
};

// Vercel Runtime Cache (in-memory when running locally). Unlike "use cache", it only stores what we
// explicitly set, so a failed chunk is retried later instead of being cached as empty, and error
// messages aren't scrubbed in production.
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const inFlight = new Map<string, Promise<unknown>>();

async function cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const cache = getCache({ namespace: "subtitles-v1" });
  const hit = await cache.get(key).catch(() => null);
  if (hit) return hit as T;
  // Viewers watching the same film at once share one generation per chunk.
  let pending = inFlight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = compute()
      .then(async (value) => {
        await cache.set(key, value, { ttl: CACHE_TTL_SECONDS }).catch(() => undefined);
        return value;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

export function errorCode(err: unknown): SubtitleErrorCode {
  const message = err instanceof Error ? err.message : String(err);
  const m = message.match(/^(not_found|unsupported|audio_failed|billing_required|failed):/);
  if (m) return m[1] as SubtitleErrorCode;
  if (/credit card|customer_verification_required/i.test(message)) return "billing_required";
  return "failed";
}

function extractAudio(src: string, from: number, seconds: number): Promise<Buffer> {
  if (!ffmpegPath) return Promise.reject(new Error("audio_failed: ffmpeg binary missing"));
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath!, [
      "-hide_banner", "-loglevel", "error",
      "-ss", String(from), "-i", src, "-t", String(seconds),
      "-vn", "-ac", "1", "-ar", "16000", "-b:a", "32k", "-f", "mp3", "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    let stderr = "";
    const timer = setTimeout(() => proc.kill("SIGKILL"), 90_000);
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.stderr.on("data", (c: Buffer) => (stderr += c));
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`audio_failed: ${e.message}`));
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`audio_failed: ffmpeg exited ${code} ${stderr.slice(0, 300)}`));
    });
  });
}

/** When the model returns text without timings, spread sentences across the window by length. */
function spreadText(text: string, start: number, end: number): Cue[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const total = sentences.reduce((n, s) => n + s.length, 0);
  let t = start;
  return sentences.map((s) => {
    const d = ((end - start) * s.length) / total;
    const cue = { start: t, end: t + d, text: s };
    t += d;
    return cue;
  });
}

function getTranscript(id: string, ep: number, chunk: number) {
  return cached(`transcript:${id}:${ep}:${chunk}`, () => transcribeChunk(id, ep, chunk));
}

async function transcribeChunk(id: string, ep: number, chunk: number): Promise<{ cues: Cue[]; language?: string }> {
  const title = await getTitle(id);
  const episode = title?.episodes[ep];
  if (!title || !episode) return fail("not_found");

  const start = chunk * CHUNK_SECONDS;
  const end = start + CHUNK_SECONDS;
  if (episode.duration && start >= episode.duration) return { cues: [] };

  const from = Math.max(0, start - PAD_SECONDS);
  const audio = await extractAudio(episode.src, from, CHUNK_SECONDS + PAD_SECONDS * 2);
  if (audio.length < 2000) return { cues: [] };

  const result = await transcribe({ model: TRANSCRIBE_MODEL, audio, maxRetries: 1 });

  let cues: Cue[] = result.segments.length
    ? result.segments
        .map((s) => ({ start: from + s.startSecond, end: from + s.endSecond, text: s.text.trim() }))
        .filter((c) => {
          const mid = (c.start + c.end) / 2;
          return mid >= start && mid < end;
        })
    : spreadText(result.text, start, end);

  cues = cues.filter((c, i) => c.text && !HALLUCINATIONS.test(c.text) && c.text !== cues[i - 1]?.text);
  return { cues, language: result.language ?? undefined };
}

async function translateCues(cues: Cue[], lang: string): Promise<Cue[]> {
  const { output } = await generateText({
    model: TRANSLATE_MODEL,
    maxRetries: 1,
    output: Output.array({
      element: z.object({ text: z.string() }),
      minItems: cues.length,
      maxItems: cues.length,
    }),
    system:
      "You translate film and TV subtitles. Translate each line naturally and concisely, keeping the speaker's tone. " +
      "Return exactly one translated line per input line, in the same order. Never merge, split, skip or explain lines.",
    prompt: `Translate these ${cues.length} subtitle lines into ${languageName(lang)}:\n\n${cues
      .map((c, i) => `${i + 1}. ${c.text}`)
      .join("\n")}`,
  });
  if (output.length !== cues.length) return cues;
  return cues.map((c, i) => ({ ...c, text: output[i].text.trim() || c.text }));
}

export function getSubtitles(id: string, ep: number, chunk: number, lang: string): Promise<Cue[]> {
  return cached(`subtitles:${id}:${ep}:${chunk}:${lang}`, () => buildSubtitles(id, ep, chunk, lang));
}

async function buildSubtitles(id: string, ep: number, chunk: number, lang: string): Promise<Cue[]> {
  const { cues, language } = await getTranscript(id, ep, chunk);
  if (lang === ORIGINAL || cues.length === 0) return cues;

  // Skip translation when the film is already in the requested language.
  const target = languageName(lang).toLowerCase();
  const spoken = language?.toLowerCase();
  if (spoken && (spoken === lang.toLowerCase() || spoken === target || lang.toLowerCase().startsWith(`${spoken}-`))) {
    return cues;
  }
  return translateCues(cues, lang);
}
