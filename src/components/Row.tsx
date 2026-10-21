import Link from "next/link";
import type { TitleSummary } from "@/lib/types";
import { TitleCard } from "./TitleCard";

export function Row({ heading, titles, href }: { heading: string; titles: TitleSummary[]; href?: string }) {
  if (titles.length === 0) return null;
  return (
    <section className="py-4">
      <div className="mb-3 flex items-baseline justify-between px-4 sm:px-10">
        <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2>
        {href && (
          <Link href={href} className="text-sm text-muted hover:text-accent">
            See all →
          </Link>
        )}
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-4 sm:scroll-px-10 sm:px-10">
        {titles.map((t) => (
          <TitleCard key={t.id} title={t} className="w-32 shrink-0 snap-start sm:w-40 lg:w-44" />
        ))}
      </div>
    </section>
  );
}

export function Grid({ titles }: { titles: TitleSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {titles.map((t) => (
        <TitleCard key={t.id} title={t} />
      ))}
    </div>
  );
}
