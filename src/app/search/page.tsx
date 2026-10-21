import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/SearchView";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <div className="px-4 pb-16 pt-28 sm:px-10">
      <Suspense>
        <SearchView />
      </Suspense>
    </div>
  );
}
