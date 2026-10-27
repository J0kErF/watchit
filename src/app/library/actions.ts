"use server";

import { cookies } from "next/headers";
import { EMBED_COOKIE, resolveEmbedDomain } from "@/lib/embed";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export type LibraryState = { ok: boolean; message: string } | null;

export async function saveLibrary(_prev: LibraryState, form: FormData): Promise<LibraryState> {
  const [jar, lang] = await Promise.all([cookies(), getLang()]);
  const input = String(form.get("domain") ?? "").trim();
  if (form.get("intent") === "default" || !input) {
    jar.delete(EMBED_COOKIE);
    return { ok: true, message: t(lang, "Using the default library.") };
  }
  const embedUrl = await resolveEmbedDomain(input);
  if (!embedUrl) {
    return { ok: false, message: t(lang, "That domain isn’t enabled on Jawy. Ask the site owner to add it.") };
  }
  const host = new URL(embedUrl).hostname;
  jar.set(EMBED_COOKIE, host, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: true, httpOnly: true });
  return { ok: true, message: t(lang, "Now playing your library from {host}.", { host }) };
}
