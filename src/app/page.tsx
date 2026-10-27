import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/Browse";
import { ContinueWatching } from "@/components/ContinueWatching";
import { KidsBrowse } from "@/components/KidsBrowse";
import { getKids, getLang } from "@/lib/lang";
import { discover, getNewSeries, getSeriesFrom, getSeriesList, getTmdbList } from "@/lib/tmdb";

export default function HomePage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const [lang, kids] = await Promise.all([getLang(), getKids()]);
  if (kids) return <KidsBrowse scope="home" lang={lang} />;
  const list = (path: string) => getTmdbList(path, {}, 1, 1, lang);
  return (
    <Browse
      lang={lang}
      featured={list("/trending/all/day")}
      eyebrow="Trending today"
      rows={[
        { heading: "Top 10 movies today", titles: list("/trending/movie/day"), top10: true },
        { heading: "Trending now", titles: list("/trending/all/week") },
        { heading: "New series", titles: getNewSeries(lang) },
        { heading: "New releases", titles: list("/movie/now_playing") },
        { heading: "Top 10 series today", titles: list("/trending/tv/day"), top10: true },
        { heading: "Popular movies", titles: list("/movie/popular") },
        { heading: "Popular series", titles: list("/tv/popular") },
        { heading: "New episodes this week", titles: list("/tv/on_the_air") },
        { heading: "Turkish series", titles: getSeriesFrom("turkish", "popular", lang) },
        { heading: "New Turkish series", titles: getSeriesFrom("turkish", "new", lang) },
        { heading: "Turkish series on Netflix", titles: getSeriesFrom("turkish", "netflix", lang) },
        { heading: "Arabic series", titles: getSeriesFrom("arabic", "popular", lang) },
        { heading: "Ramadan 2026 series", titles: getSeriesFrom("arabic", "ramadan", lang) },
        { heading: "Arabic series on Netflix", titles: getSeriesFrom("arabic", "netflix", lang) },
        { heading: "Arabic series on Shahid", titles: getSeriesFrom("arabic", "shahid", lang) },
        { heading: "Action & adventure", titles: discover("movie", "28,12", "|", lang) },
        { heading: "Critically acclaimed movies", titles: list("/movie/top_rated") },
        { heading: "Best series of all time", titles: getSeriesList("best", lang) },
        { heading: "Comedies", titles: discover("movie", "35", ",", lang) },
        { heading: "Anime", titles: getSeriesList("anime", lang) },
        { heading: "Sci-fi & fantasy", titles: discover("movie", "878,14", "|", lang) },
        { heading: "Crime TV", titles: discover("tv", "80", ",", lang) },
        { heading: "Horror", titles: discover("movie", "27", ",", lang) },
        { heading: "Documentary series", titles: discover("tv", "99", ",", lang) },
        { heading: "Animation", titles: discover("movie", "16", ",", lang) },
        { heading: "Coming soon", titles: list("/movie/upcoming") },
        { heading: "Coming soon series", titles: getSeriesList("upcoming", lang) },
      ]}
    >
      <ContinueWatching />
    </Browse>
  );
}
