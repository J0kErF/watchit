import type { Metadata } from "next";
import { MyList } from "@/components/MyList";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "My List" };

export default function MyListPage() {
  return (
    <div className="pb-16 pt-28">
      <div className="px-4 sm:px-10">
        <PageHeader title="My List" subtitle="Saved in this browser only." />
      </div>
      <MyList />
    </div>
  );
}
