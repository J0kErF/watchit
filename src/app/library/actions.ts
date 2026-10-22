"use server";

import { cookies } from "next/headers";
import { EMBED_COOKIE, resolveEmbedDomain } from "@/lib/embed";

export type LibraryState = { ok: boolean; message: string } | null;

export async function saveLibrary(_prev: LibraryState, form: FormData): Promise<LibraryState> {
  const jar = await cookies();
  const input = String(form.get("domain") ?? "").trim();
  if (form.get("intent") === "default" || !input) {
    jar.delete(EMBED_COOKIE);
    return { ok: true, message: "Using the default library." };
  }
  const embedUrl = await resolveEmbedDomain(input);
  if (!embedUrl) {
    return { ok: false, message: "That domain isn’t enabled on WatchIt. Ask the site owner to add it." };
  }
  const host = new URL(embedUrl).hostname;
  jar.set(EMBED_COOKIE, host, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: true, httpOnly: true });
  return { ok: true, message: `Now playing your library from ${host}.` };
}
