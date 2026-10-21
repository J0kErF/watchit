import { ContinueWatching } from "@/components/ContinueWatching";
import { Hero } from "@/components/Hero";
import { Row } from "@/components/Row";
import { getCatalog, getTitle } from "@/lib/archive";
import { FEATURED_ID } from "@/lib/catalog";

const GENRE_ROWS = [
  { heading: "Noir & thrillers", genres: ["Noir", "Thriller", "Mystery"] },
  { heading: "Laugh out loud", genres: ["Comedy"] },
  { heading: "Chills & thrills", genres: ["Horror", "Sci-Fi"] },
  { heading: "Animated", genres: ["Animation"] },
  { heading: "Silent era", genres: ["Silent"] },
];

export default async function HomePage() {
  const [featured, catalog] = await Promise.all([getTitle(FEATURED_ID), getCatalog()]);
  const movies = catalog.filter((t) => t.kind === "movie");
  const series = catalog.filter((t) => t.kind === "series");

  return (
    <>
      {featured ? <Hero title={featured} eyebrow="Featured tonight" /> : <div className="h-20" />}
      <div className="relative z-10 -mt-10 space-y-2 pb-10">
        <ContinueWatching />
        <Row heading="Classic series" titles={series} href="/series" />
        <Row heading="Popular movies" titles={movies.slice(0, 14)} href="/movies" />
        {GENRE_ROWS.map((row) => (
          <Row
            key={row.heading}
            heading={row.heading}
            titles={catalog.filter((t) => t.genres.some((g) => row.genres.includes(g)))}
          />
        ))}
      </div>
    </>
  );
}
