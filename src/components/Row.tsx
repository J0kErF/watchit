import type { TitleSummary } from "@/lib/types";
import { RowScroller } from "./RowScroller";
import { RankCard, TitleCard, WideCard } from "./TitleCard";

export function Row({ heading, titles, top10 = false }: { heading: string; titles: TitleSummary[]; top10?: boolean }) {
  if (titles.length === 0) return null;
  return (
    <section className="py-2 sm:py-3" aria-label={heading}>
      <h2 className="px-4 text-lg font-semibold tracking-tight sm:px-12 sm:text-xl lg:text-2xl">{heading}</h2>
      <RowScroller label={heading}>
        {top10
          ? titles.slice(0, 10).map((t, i) => <RankCard key={t.id} title={t} rank={i + 1} />)
          : titles.map((t) => <WideCard key={t.id} title={t} className="w-64 sm:w-72 lg:w-80" />)}
      </RowScroller>
    </section>
  );
}

export function RowSkeleton() {
  return (
    <div className="py-3">
      <div className="mx-4 h-6 w-48 animate-pulse rounded bg-surface-2 sm:mx-12" />
      <div className="flex gap-3 overflow-hidden px-4 py-3 sm:px-12">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-video w-64 shrink-0 animate-pulse rounded-md bg-surface sm:w-72 lg:w-80" />
        ))}
      </div>
    </div>
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
