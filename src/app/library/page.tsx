import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EMBED_URL, getEmbedUrl } from "@/lib/embed";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { LibraryForm } from "./LibraryForm";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="px-4 pb-16 pt-28 sm:px-12">
      <Suspense>
        <Library />
      </Suspense>
    </div>
  );
}

async function Library() {
  const [embedUrl, lang] = await Promise.all([getEmbedUrl(), getLang()]);
  const current = new URL(embedUrl).hostname;
  return (
    <>
      <PageHeader title={t(lang, "Library")} subtitle={t(lang, "Watch the titles you’ve purchased by connecting your own library.")} />
      <LibraryForm current={current} defaultHost={new URL(EMBED_URL).hostname} />
    </>
  );
}
