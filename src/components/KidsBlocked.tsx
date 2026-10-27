import Link from "next/link";
import { type Lang, t } from "@/lib/i18n";

/** Shown instead of a title that isn't rated for kids while Kids mode is on. */
export function KidsBlocked({ lang }: { lang: Lang }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-16 text-center">
      <div className="max-w-md">
        <p className="font-display text-4xl font-bold tracking-tight text-accent">{t(lang, "Not available in Kids mode")}</p>
        <p className="mt-3 text-muted">{t(lang, "This title isn’t rated for kids. Turn off Kids mode to watch it.")}</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">
          {t(lang, "Back to home")}
        </Link>
      </div>
    </div>
  );
}
