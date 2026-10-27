import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KidsBlocked } from "@/components/KidsBlocked";
import { Player } from "@/components/Player";
import { getEmbedUrl } from "@/lib/embed";
import { allowedForKids } from "@/lib/kids";
import { getKids, getLang } from "@/lib/lang";
import { getTitle } from "@/lib/titles";

export async function generateMetadata({ params }: PageProps<"/watch/[id]">): Promise<Metadata> {
  const title = await getTitle((await params).id, await getLang());
  return title ? { title: title.title } : {};
}

export default function WatchPage(props: PageProps<"/watch/[id]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-black" />}>
      <WatchView {...props} />
    </Suspense>
  );
}

async function WatchView({ params, searchParams }: PageProps<"/watch/[id]">) {
  const [{ id }, query, lang, kids] = await Promise.all([params, searchParams, getLang(), getKids()]);
  const [title, embedUrl] = await Promise.all([getTitle(id, lang), getEmbedUrl()]);
  if (!title) notFound();
  if (kids && !allowedForKids(title)) return <KidsBlocked lang={lang} />;
  const ep = Number(Array.isArray(query.ep) ? query.ep[0] : query.ep) || 0;
  return <Player key={title.id} title={title} initialEp={ep} embedUrl={embedUrl} />;
}
