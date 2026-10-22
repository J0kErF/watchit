import type { Metadata } from "next";
import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/Browse";
import { discover, getTmdbList } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Movies" };

export default function MoviesPage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <Browse
        featured={getTmdbList("/trending/movie/day")}
        eyebrow="Movie of the day"
        rows={[
          { heading: "Top 10 movies today", titles: getTmdbList("/trending/movie/day"), top10: true },
          { heading: "Trending this week", titles: getTmdbList("/trending/movie/week") },
          { heading: "New releases", titles: getTmdbList("/movie/now_playing") },
          { heading: "Popular on Jawy", titles: getTmdbList("/movie/popular") },
          { heading: "Coming soon", titles: getTmdbList("/movie/upcoming") },
          { heading: "Critically acclaimed", titles: getTmdbList("/movie/top_rated") },
          { heading: "Action", titles: discover("movie", "28") },
          { heading: "Adventure", titles: discover("movie", "12") },
          { heading: "Comedy", titles: discover("movie", "35") },
          { heading: "Thrillers", titles: discover("movie", "53") },
          { heading: "Sci-fi", titles: discover("movie", "878") },
          { heading: "Horror", titles: discover("movie", "27") },
          { heading: "Drama", titles: discover("movie", "18") },
          { heading: "Romance", titles: discover("movie", "10749") },
          { heading: "Crime", titles: discover("movie", "80") },
          { heading: "Family", titles: discover("movie", "10751") },
          { heading: "Animation", titles: discover("movie", "16") },
          { heading: "Documentaries", titles: discover("movie", "99") },
        ]}
      />
    </Suspense>
  );
}
