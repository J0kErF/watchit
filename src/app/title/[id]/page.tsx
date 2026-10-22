import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Episodes } from "@/components/Episodes";
import { Hero, HeroSkeleton } from "@/components/Hero";
import { Row } from "@/components/Row";
import { getTitle } from "@/lib/titles";
import { getTmdbRecommendations, tmdbPageUrl } from "@/lib/tmdb";

export async function generateMetadata({ params }: PageProps<"/title/[id]">): Promise<Metadata> {
  const title = await getTitle((await params).id);
  if (!title) return {};
  return {
    title: title.title,
    description: title.description.slice(0, 160),
    openGraph: { title: title.title, description: title.description.slice(0, 160), images: [title.backdrop] },
  };
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
  const [title, similar] = await Promise.all([getTitle(id), getTmdbRecommendations(id)]);
  if (!title) notFound();

  const facts: [string, string | undefined][] = [
    [title.kind === "series" ? "Created by" : "Director", title.creator],
    ["Starring", title.cast.slice(0, 4).map((c) => c.name).join(", ") || undefined],
    ["Genres", title.genres.join(", ") || undefined],
  ];

  return (
    <>
      <Hero title={title} detailed />

      <div
        className={`relative z-10 -mt-8 grid gap-10 px-4 sm:-mt-14 sm:px-12 lg:gap-16 ${
          title.kind === "series" ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""
        }`}
      >
        {title.kind === "series" && (
          <div className="min-w-0">
            <Episodes titleId={title.id} episodes={title.episodes} />
          </div>
        )}
        <dl className="max-w-3xl space-y-3 text-sm">
          {facts.map(
            ([label, value]) =>
              value && (
                <div key={label}>
                  <dt className="inline text-muted">{label}: </dt>
                  <dd className="inline">{value}</dd>
                </div>
              ),
          )}
          <div>
            <dt className="inline text-muted">More details: </dt>
            <dd className="inline">
              <a href={tmdbPageUrl(title.id)} className="underline-offset-4 hover:underline">
                The Movie Database (TMDB)
              </a>
            </dd>
          </div>
        </dl>
      </div>

      {title.cast.length > 0 && (
        <section className="mt-12 px-4 sm:px-12" aria-labelledby="cast-heading">
          <h2 id="cast-heading" className="mb-4 text-xl font-semibold sm:text-2xl">
            Cast
          </h2>
          <ul className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {title.cast.map((c) => (
              <li key={`${c.name}-${c.character}`} className="w-28 shrink-0 text-center sm:w-32">
                <div className="mx-auto aspect-square w-24 overflow-hidden rounded-full bg-surface-2 sm:w-28">
                  {c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center font-display text-3xl text-muted">{c.name[0]}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium">{c.name}</p>
                {c.character && <p className="line-clamp-1 text-xs text-muted">{c.character}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 pb-6">
        <Row heading="More like this" titles={similar.filter((t) => t.id !== title.id)} />
      </div>
    </>
  );
}
