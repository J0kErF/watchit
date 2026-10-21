import type { Metadata } from "next";
import { FilterGrid } from "@/components/FilterGrid";
import { PageHeader } from "@/components/PageHeader";
import { getCatalog } from "@/lib/archive";

export const metadata: Metadata = { title: "Series" };

export default async function SeriesPage() {
  const series = (await getCatalog()).filter((t) => t.kind === "series");
  return (
    <div className="px-4 pb-16 pt-28 sm:px-10">
      <PageHeader title="Series" subtitle="Golden-age television — westerns, detectives and anthologies, episode by episode." />
      <FilterGrid titles={series} />
    </div>
  );
}
