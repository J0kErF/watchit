import type { Lang } from "@/lib/i18n";
import { getKidsList } from "@/lib/tmdb";
import { Browse, type RowSpec } from "./Browse";

/** The home, Movies or Series page in Kids mode: kids-rated rows only. */
export function KidsBrowse({ scope, lang }: { scope: "home" | "movie" | "series"; lang: Lang }) {
  const movies: RowSpec[] = [
    { heading: "Popular kids movies", titles: getKidsList("movie", "popular", lang) },
    { heading: "New for kids", titles: getKidsList("movie", "new", lang) },
    { heading: "Animated movies", titles: getKidsList("movie", "animation", lang) },
    { heading: "Family movies", titles: getKidsList("movie", "family", lang) },
    { heading: "Adventure", titles: getKidsList("movie", "adventure", lang) },
    { heading: "Comedy", titles: getKidsList("movie", "comedy", lang) },
    { heading: "Top-rated kids movies", titles: getKidsList("movie", "top", lang) },
  ];
  const series: RowSpec[] = [
    { heading: "Kids series", titles: getKidsList("tv", "popular", lang) },
    { heading: "Animated series", titles: getKidsList("tv", "animation", lang) },
    { heading: "New for kids", titles: getKidsList("tv", "new", lang) },
    { heading: "Comedy", titles: getKidsList("tv", "comedy", lang) },
    { heading: "Top-rated kids series", titles: getKidsList("tv", "top", lang) },
  ];
  const rows =
    scope === "movie"
      ? movies
      : scope === "series"
        ? series
        : // The home page mixes both, alternating.
          [movies[0], series[0], movies[1], series[1], movies[2], movies[3], series[3], movies[4], movies[6], series[4]];
  return <Browse lang={lang} featured={rows[0].titles} eyebrow="For kids" rows={rows} />;
}
