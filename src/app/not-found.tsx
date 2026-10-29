import Link from "next/link";
import { Suspense } from "react";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-16 text-center">
      <Suspense>
        <Message />
      </Suspense>
    </div>
  );
}

async function Message() {
  const lang = await getLang();
  return (
    <div>
      <p className="font-display text-7xl font-bold tracking-tight text-accent">{t(lang, "The End")}</p>
      <p className="mt-3 text-muted">
        {t(lang, "This title isn’t available — it may not be in the library, or it has no playable video.")}
      </p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">
        {t(lang, "Back to home")}
      </Link>
    </div>
  );
}
