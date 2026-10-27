import type { Metadata } from "next";
import { Suspense } from "react";
import { MyList } from "@/components/MyList";
import { PageHeader } from "@/components/PageHeader";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = { title: "My List" };

export default function MyListPage() {
  return (
    <div className="pb-16 pt-28">
      <Suspense>
        <Header />
      </Suspense>
      <MyList />
    </div>
  );
}

async function Header() {
  const lang = await getLang();
  return (
    <div className="px-4 sm:px-12">
      <PageHeader title={t(lang, "My List")} subtitle={t(lang, "Saved in this browser only.")} />
    </div>
  );
}
