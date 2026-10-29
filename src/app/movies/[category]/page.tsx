import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryView } from "@/components/CategoryPage";
import { CATEGORIES, findCategory } from "@/lib/categories";
import { getKids, getLang } from "@/lib/lang";

export function generateStaticParams() {
  return CATEGORIES.movie.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/movies/[category]">): Promise<Metadata> {
  const category = findCategory("movie", (await params).category);
  return category ? { title: `${category.label} movies` } : {};
}

export default function MovieCategoryPage({ params, searchParams }: PageProps<"/movies/[category]">) {
  return (
    <div className="px-4 pb-16 pt-28 sm:px-12">
      <Suspense>
        <View params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function View({ params, searchParams }: PageProps<"/movies/[category]">) {
  const [{ category }, query, lang, kids] = await Promise.all([params, searchParams, getLang(), getKids()]);
  return <CategoryView kind="movie" slug={category} searchParams={query} lang={lang} kids={kids} />;
}
