import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CleanCustomPlayer from "@/components/CleanCustomPlayer";
import { getEmbedUrl } from "@/lib/embed";
import { getTitle } from "@/lib/titles";

export async function generateMetadata({ params }: PageProps<"/watch/[id]">): Promise<Metadata> {
  const title = await getTitle((await params).id);
  return title ? { title: `Watch ${title.title}` } : {};
}

export default function WatchPage(props: PageProps<"/watch/[id]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-black" />}>
      <WatchView {...props} />
    </Suspense>
  );
}

async function WatchView({ params, searchParams }: PageProps<"/watch/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [title, embedUrl] = await Promise.all([getTitle(id), getEmbedUrl()]);
  if (!title) notFound();
  const ep = Number(Array.isArray(query.ep) ? query.ep[0] : query.ep) || 0;
  return <CleanCustomPlayer key={title.id} title={title} initialEp={ep} embedUrl={embedUrl} />;
}
