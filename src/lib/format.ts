import { type Lang, t } from "./i18n";

export function formatDuration(seconds?: number, lang: Lang = "en") {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? t(lang, "{h}h {m}m", { h, m }) : t(lang, "{m}m", { m });
}
