import type { Metadata } from "next";
import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/Browse";
import { discover, getNewSeries, getTmdbList } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Series" };

export default function SeriesPage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <Browse
        featured={getTmdbList("/trending/tv/day")}
        eyebrow="Series of the day"
        rows={[
          { heading: "Top 10 series today", titles: getTmdbList("/trending/tv/day"), top10: true },
          { heading: "New series", titles: getNewSeries() },
          { heading: "Trending this week", titles: getTmdbList("/trending/tv/week") },
          { heading: "New episodes this week", titles: getTmdbList("/tv/on_the_air") },
          { heading: "Airing today", titles: getTmdbList("/tv/airing_today") },
          { heading: "Popular series", titles: getTmdbList("/tv/popular") },
          { heading: "Binge-worthy", titles: getTmdbList("/tv/top_rated") },
          { heading: "Drama", titles: discover("tv", "18") },
          { heading: "Crime", titles: discover("tv", "80") },
          { heading: "Comedy", titles: discover("tv", "35") },
          { heading: "Sci-fi & fantasy", titles: discover("tv", "10765") },
          { heading: "Action & adventure", titles: discover("tv", "10759") },
          { heading: "Mystery", titles: discover("tv", "9648") },
          { heading: "Anime & animation", titles: discover("tv", "16") },
          { heading: "Documentary series", titles: discover("tv", "99") },
          { heading: "Kids & family", titles: discover("tv", "10762,10751", "|") },
        ]}
      />
    </Suspense>
  );
}
