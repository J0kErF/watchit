import type { Metadata } from "next";
import { FilterGrid } from "@/components/FilterGrid";
import { PageHeader } from "@/components/PageHeader";
import { getCatalog } from "@/lib/archive";

export const metadata: Metadata = { title: "Movies" };

export default async function MoviesPage() {
  const movies = (await getCatalog()).filter((t) => t.kind === "movie");
  return (
    <div className="px-4 pb-16 pt-28 sm:px-10">
      <PageHeader
        title="Movies"
        subtitle="Screwball comedies, film noir, silent horror and open-source animation — every one free to watch."
      />
      <FilterGrid titles={movies} />
    </div>
  );
}
