import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EMBED_URL, getEmbedUrl } from "@/lib/embed";
import { LibraryForm } from "./LibraryForm";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="px-4 pb-16 pt-28 sm:px-12">
      <PageHeader title="Library" subtitle="Watch the titles you’ve purchased by connecting your own library." />
      <Suspense>
        <Library />
      </Suspense>
    </div>
  );
}

async function Library() {
  const current = new URL(await getEmbedUrl()).hostname;
  return <LibraryForm current={current} defaultHost={new URL(EMBED_URL).hostname} />;
}
