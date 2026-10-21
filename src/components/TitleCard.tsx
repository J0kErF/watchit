import Link from "next/link";
import { formatRuntime } from "@/lib/format";
import type { TitleSummary } from "@/lib/types";

export function TitleCard({ title, className = "" }: { title: TitleSummary; className?: string }) {
  const meta = [title.year, title.kind === "series" ? "Series" : formatRuntime(title.runtime)]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link href={`/title/${title.id}`} className={`group block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface-2 ring-1 ring-line transition duration-300 group-hover:-translate-y-1 group-hover:ring-accent/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={title.poster}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        {title.kind === "series" && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            Series
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium">{title.title}</p>
      {meta && <p className="text-xs text-muted">{meta}</p>}
    </Link>
  );
}
