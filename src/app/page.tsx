import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/Browse";
import { ContinueWatching } from "@/components/ContinueWatching";
import { discover, getNewSeries, getTmdbList } from "@/lib/tmdb";

export default function HomePage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <Browse
        featured={getTmdbList("/trending/all/day")}
        eyebrow="Trending today"
        rows={[
          { heading: "Top 10 movies today", titles: getTmdbList("/trending/movie/day"), top10: true },
          { heading: "Trending now", titles: getTmdbList("/trending/all/week") },
          { heading: "New series", titles: getNewSeries() },
          { heading: "New releases", titles: getTmdbList("/movie/now_playing") },
          { heading: "Top 10 series today", titles: getTmdbList("/trending/tv/day"), top10: true },
          { heading: "Popular movies", titles: getTmdbList("/movie/popular") },
          { heading: "Popular series", titles: getTmdbList("/tv/popular") },
          { heading: "New episodes this week", titles: getTmdbList("/tv/on_the_air") },
          { heading: "Action & adventure", titles: discover("movie", "28,12", "|") },
          { heading: "Critically acclaimed movies", titles: getTmdbList("/movie/top_rated") },
          { heading: "Comedies", titles: discover("movie", "35") },
          { heading: "Binge-worthy series", titles: getTmdbList("/tv/top_rated") },
          { heading: "Sci-fi & fantasy", titles: discover("movie", "878,14", "|") },
          { heading: "Crime TV", titles: discover("tv", "80") },
          { heading: "Horror", titles: discover("movie", "27") },
          { heading: "Animation", titles: discover("movie", "16") },
          { heading: "Coming soon", titles: getTmdbList("/movie/upcoming") },
        ]}
      >
        <ContinueWatching />
      </Browse>
    </Suspense>
  );
}
