import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Hero, HeroSkeleton } from "@/components/Hero";
import { Row } from "@/components/Row";
import { getCatalog, getTitle, licenseLabel } from "@/lib/archive";
import { CATALOG } from "@/lib/catalog";
import { formatDuration } from "@/lib/format";

export async function generateStaticParams() {
  return CATALOG.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/title/[id]">): Promise<Metadata> {
  const title = await getTitle((await params).id);
  return title ? { title: title.title, description: title.description.slice(0, 160) } : {};
}

export default function TitlePage({ params }: PageProps<"/title/[id]">) {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <TitleView params={params} />
    </Suspense>
  );
}

async function TitleView({ params }: { params: PageProps<"/title/[id]">["params"] }) {
  const { id } = await params;
  const [title, catalog] = await Promise.all([getTitle(id), getCatalog()]);
  if (!title) notFound();

  const similar = catalog.filter((t) => t.id !== title.id && t.genres.some((g) => title.genres.includes(g)));

  return (
    <>
      <Hero title={title} detailed />

      {title.kind === "series" && (
        <section className="px-4 pb-6 sm:px-10">
          <h2 className="mb-4 font-display text-3xl">Episodes</h2>
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {title.episodes.map((e) => (
              <li key={e.src}>
                <Link
                  href={`/watch/${title.id}?ep=${e.index}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-surface-2 sm:px-6"
                >
                  <span className="w-8 shrink-0 font-display text-2xl text-muted tabular-nums group-hover:text-accent">
                    {e.index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.title}</span>
                    {e.season && e.number && (
                      <span className="text-xs text-muted">
                        Season {e.season} · Episode {e.number}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-muted">{formatDuration(e.duration)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="px-4 py-6 text-sm text-muted sm:px-10">
        <dl className="grid max-w-3xl grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          {title.creator && (
            <>
              <dt>Credits</dt>
              <dd className="text-foreground">{title.creator}</dd>
            </>
          )}
          <dt>License</dt>
          <dd className="text-foreground">
            <a href={title.license} className="underline-offset-4 hover:underline">
              {licenseLabel(title.license)}
            </a>
          </dd>
          <dt>Source</dt>
          <dd>
            <a href={`https://archive.org/details/${title.id}`} className="text-foreground underline-offset-4 hover:underline">
              archive.org/details/{title.id}
            </a>
          </dd>
        </dl>
      </section>

      <div className="pb-12">
        <Row heading="More like this" titles={similar} />
      </div>
    </>
  );
}
