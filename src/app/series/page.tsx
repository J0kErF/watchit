import type { Metadata } from "next";
import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/Browse";
import { KidsBrowse } from "@/components/KidsBrowse";
import { getKids, getLang } from "@/lib/lang";
import { discover, getNewSeries, getSeriesFrom, getSeriesList, getTmdbList } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Series" };

export default function SeriesPage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <SeriesView />
    </Suspense>
  );
}

async function SeriesView() {
  const [lang, kids] = await Promise.all([getLang(), getKids()]);
  if (kids) return <KidsBrowse scope="series" lang={lang} />;
  const list = (path: string) => getTmdbList(path, {}, 1, 1, lang);
  const genre = (genres: string, join: "," | "|" = ",") => discover("tv", genres, join, lang);
  return (
    <Browse
      lang={lang}
      featured={list("/trending/tv/day")}
      eyebrow="Series of the day"
      rows={[
        { heading: "Top 10 series today", titles: list("/trending/tv/day"), top10: true },
        { heading: "New series", titles: getNewSeries(lang) },
        { heading: "Trending this week", titles: list("/trending/tv/week") },
        { heading: "New episodes this week", titles: list("/tv/on_the_air") },
        { heading: "Airing today", titles: list("/tv/airing_today") },
        { heading: "Popular series", titles: list("/tv/popular") },
        { heading: "Coming soon series", titles: getSeriesList("upcoming", lang) },
        { heading: "New Turkish series", titles: getSeriesFrom("turkish", "new", lang) },
        { heading: "Turkish series: new episodes this week", titles: getSeriesFrom("turkish", "airing", lang) },
        { heading: "Popular Turkish series", titles: getSeriesFrom("turkish", "popular", lang) },
        { heading: "Turkish series on Netflix", titles: getSeriesFrom("turkish", "netflix", lang) },
        { heading: "Top-rated Turkish series", titles: getSeriesFrom("turkish", "top", lang) },
        { heading: "New Arabic series", titles: getSeriesFrom("arabic", "new", lang) },
        { heading: "Arabic series: new episodes this week", titles: getSeriesFrom("arabic", "airing", lang) },
        { heading: "Ramadan 2026 series", titles: getSeriesFrom("arabic", "ramadan", lang) },
        { heading: "Egyptian series", titles: getSeriesFrom("egyptian", "popular", lang) },
        { heading: "Syrian & Lebanese series", titles: getSeriesFrom("levantine", "popular", lang) },
        { heading: "Arabic series on Netflix", titles: getSeriesFrom("arabic", "netflix", lang) },
        { heading: "Arabic series on Shahid", titles: getSeriesFrom("arabic", "shahid", lang) },
        { heading: "Popular Arabic series", titles: getSeriesFrom("arabic", "popular", lang) },
        { heading: "Top-rated Arabic series", titles: getSeriesFrom("arabic", "top", lang) },
        { heading: "Best series of all time", titles: getSeriesList("best", lang) },
        { heading: "Binge-worthy", titles: list("/tv/top_rated") },
        { heading: "Drama", titles: genre("18") },
        { heading: "Crime", titles: genre("80") },
        { heading: "Comedy", titles: genre("35") },
        { heading: "Sci-fi & fantasy", titles: genre("10765") },
        { heading: "Action & adventure", titles: genre("10759") },
        { heading: "Mystery", titles: genre("9648") },
        { heading: "Anime", titles: getSeriesList("anime", lang) },
        { heading: "Animation", titles: genre("16") },
        { heading: "Documentary series", titles: genre("99") },
        { heading: "Kids & family", titles: genre("10762,10751", "|") },
      ]}
    />
  );
}
