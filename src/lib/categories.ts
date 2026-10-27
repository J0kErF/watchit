import { kidsFilter } from "./kids";
import { type Kind, TODAY } from "./types";

export interface Subcategory {
  slug: string;
  label: string;
  /** Added to the category's filter. */
  filter: Record<string, string>;
  /** Overrides the category's minimum votes. */
  minVotes?: number;
}

export interface Category {
  slug: string;
  label: string;
  /** TMDb /discover filter. */
  filter: Record<string, string>;
  /** Minimum TMDb votes for the popular sort; titles from smaller markets get far fewer votes. */
  minVotes: number;
  /** Minimum votes for the top-rated sort, when three times `minVotes` would let obscure titles in. */
  topVotes?: number;
  /** Listed in Kids mode. Origin categories have no US ratings, so Kids mode would leave them empty. */
  kids?: boolean;
  /** Narrower lists, shown as chips on the category page (`?sub=`). */
  subs?: Subcategory[];
}

// Genre ids differ between TMDb movies and TV, and TV has no horror genre (the "horror" keyword
// stands in). Origin filters use the original language where a language spans several countries.
const ARABIC = { with_original_language: "ar" };
const TURKISH = { with_origin_country: "TR" };
const KOREAN = { with_original_language: "ko" };
const INDIAN = { with_origin_country: "IN" };
const SPANISH = { with_original_language: "es" };
const ANIME = { with_genres: "16", with_original_language: "ja" };

// Arabic titles by country, under the Arabic category.
const ARABIC_SUBS: Subcategory[] = [
  { slug: "egyptian", label: "Egyptian", filter: { with_origin_country: "EG" }, minVotes: 3 },
  { slug: "syrian", label: "Syrian", filter: { with_origin_country: "SY" }, minVotes: 1 },
  { slug: "lebanese", label: "Lebanese", filter: { with_origin_country: "LB" }, minVotes: 1 },
];

// Horror subgenres are TMDb keywords ("|" matches any of them).
const HORROR_SUBS: Subcategory[] = [
  { slug: "supernatural", label: "Supernatural", filter: { with_keywords: "6152" } },
  { slug: "slasher", label: "Slasher", filter: { with_keywords: "12339" } },
  { slug: "ghosts", label: "Ghosts", filter: { with_keywords: "162846" } },
  { slug: "possession", label: "Possession & exorcism", filter: { with_keywords: "9712|2626" } },
  { slug: "haunted-houses", label: "Haunted houses", filter: { with_keywords: "3358" } },
  { slug: "zombies", label: "Zombies", filter: { with_keywords: "12377" } },
  { slug: "vampires", label: "Vampires", filter: { with_keywords: "3133" } },
  { slug: "werewolves", label: "Werewolves", filter: { with_keywords: "12564" } },
  { slug: "witches", label: "Witches", filter: { with_keywords: "616" } },
  { slug: "found-footage", label: "Found footage", filter: { with_keywords: "163053" } },
  { slug: "psychological", label: "Psychological", filter: { with_keywords: "295907" } },
  { slug: "arabic", label: "Arabic horror", filter: ARABIC, minVotes: 0 },
  { slug: "korean", label: "Korean horror", filter: KOREAN, minVotes: 5 },
];

/** Categories for the Movies and Series menus in the navbar and the /movies|/series/[category] pages. */
export const CATEGORIES: Record<Kind, Category[]> = {
  movie: [
    { slug: "action", label: "Action", filter: { with_genres: "28" }, minVotes: 300, kids: true },
    { slug: "comedy", label: "Comedy", filter: { with_genres: "35" }, minVotes: 300, kids: true },
    { slug: "drama", label: "Drama", filter: { with_genres: "18" }, minVotes: 300, kids: true },
    // Every horror movie TMDb has, not only well-known ones; Top rated still needs real votes.
    { slug: "horror", label: "Horror", filter: { with_genres: "27" }, minVotes: 0, topVotes: 300, subs: HORROR_SUBS },
    { slug: "thriller", label: "Thriller", filter: { with_genres: "53" }, minVotes: 300 },
    { slug: "romance", label: "Romance", filter: { with_genres: "10749" }, minVotes: 300 },
    { slug: "sci-fi", label: "Sci-Fi", filter: { with_genres: "878" }, minVotes: 300, kids: true },
    { slug: "crime", label: "Crime", filter: { with_genres: "80" }, minVotes: 300 },
    { slug: "animation", label: "Animation", filter: { with_genres: "16" }, minVotes: 300, kids: true },
    { slug: "anime", label: "Anime", filter: ANIME, minVotes: 100, kids: true },
    { slug: "family", label: "Family", filter: { with_genres: "10751" }, minVotes: 300, kids: true },
    { slug: "documentary", label: "Documentary", filter: { with_genres: "99" }, minVotes: 100, kids: true },
    { slug: "arabic", label: "Arabic", filter: ARABIC, minVotes: 10, subs: ARABIC_SUBS },
    { slug: "turkish", label: "Turkish", filter: TURKISH, minVotes: 20 },
    { slug: "korean", label: "Korean", filter: KOREAN, minVotes: 50 },
    { slug: "indian", label: "Indian", filter: INDIAN, minVotes: 50 },
    { slug: "spanish", label: "Spanish", filter: SPANISH, minVotes: 100 },
  ],
  series: [
    { slug: "drama", label: "Drama", filter: { with_genres: "18" }, minVotes: 100, kids: true },
    { slug: "action", label: "Action & Adventure", filter: { with_genres: "10759" }, minVotes: 100, kids: true },
    { slug: "comedy", label: "Comedy", filter: { with_genres: "35" }, minVotes: 100, kids: true },
    { slug: "crime", label: "Crime", filter: { with_genres: "80" }, minVotes: 100 },
    { slug: "horror", label: "Horror", filter: { with_keywords: "315058" }, minVotes: 50 },
    { slug: "sci-fi", label: "Sci-Fi & Fantasy", filter: { with_genres: "10765" }, minVotes: 100, kids: true },
    { slug: "mystery", label: "Mystery", filter: { with_genres: "9648" }, minVotes: 100 },
    { slug: "animation", label: "Animation", filter: { with_genres: "16" }, minVotes: 100, kids: true },
    { slug: "anime", label: "Anime", filter: ANIME, minVotes: 20, kids: true },
    { slug: "documentary", label: "Documentary", filter: { with_genres: "99" }, minVotes: 20, kids: true },
    { slug: "arabic", label: "Arabic", filter: ARABIC, minVotes: 5, subs: ARABIC_SUBS },
    { slug: "turkish", label: "Turkish", filter: TURKISH, minVotes: 20 },
    { slug: "korean", label: "Korean", filter: KOREAN, minVotes: 20 },
    { slug: "indian", label: "Indian", filter: INDIAN, minVotes: 10 },
    { slug: "spanish", label: "Spanish", filter: SPANISH, minVotes: 20 },
  ],
};

export const findCategory = (kind: Kind, slug: string): Category | undefined =>
  CATEGORIES[kind].find((c) => c.slug === slug);

/** The categories to list: in Kids mode, only the ones with kids titles. */
export const categoriesFor = (kind: Kind, kids: boolean) => CATEGORIES[kind].filter((c) => !kids || c.kids);

export const findSub = (category: Category, slug: unknown): Subcategory | undefined =>
  typeof slug === "string" && slug ? category.subs?.find((s) => s.slug === slug) : undefined;

/** The site path of a category page. */
export const categoryPath = (kind: Kind, slug: string) => `/${kind === "movie" ? "movies" : "series"}/${slug}`;

export const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "new", label: "Newest" },
  { value: "top", label: "Top rated" },
] as const;
export type Sort = (typeof SORTS)[number]["value"];

export const DECADES = [
  { value: "", label: "All years" },
  { value: "2020s", label: "2020s" },
  { value: "2010s", label: "2010s" },
  { value: "2000s", label: "2000s" },
  { value: "1990s", label: "1990s" },
  { value: "older", label: "Older" },
] as const;
export type Decade = (typeof DECADES)[number]["value"];

export const parseSort = (value: unknown): Sort => (SORTS.some((s) => s.value === value) ? (value as Sort) : "popular");
export const parseDecade = (value: unknown): Decade =>
  DECADES.some((d) => d.value === value) ? (value as Decade) : "";

/** TMDb pages per batch: the first render shows one batch, Load more fetches the next. */
export const PAGES_PER_BATCH = 3;

/** The /discover query for a category, sorted, and limited to a decade, a subcategory or Kids mode. */
export function categoryQuery(kind: Kind, category: Category, sort: Sort, decade: Decade, sub?: Subcategory, kids = false) {
  const type = kind === "movie" ? "movie" : "tv";
  const date = kind === "movie" ? "primary_release_date" : "first_air_date";
  const minVotes = sub?.minVotes ?? category.minVotes;
  const topVotes = sub?.minVotes !== undefined ? Math.max(sub.minVotes * 3, 3) : (category.topVotes ?? category.minVotes * 3);
  const params: Record<string, string> = {
    ...category.filter,
    ...sub?.filter,
    include_adult: "false",
    // Leave out news, reality and talk shows; the ids only exist for TV.
    ...(kind === "series" && { without_genres: "10763,10764,10767" }),
    ...(kids && kidsFilter(type)),
  };
  if (sort === "popular") Object.assign(params, { sort_by: "popularity.desc", "vote_count.gte": String(minVotes) });
  // Newest: released already, with a few votes so placeholders and unreleased entries stay out.
  if (sort === "new") Object.assign(params, { sort_by: `${date}.desc`, [`${date}.lte`]: TODAY, "vote_count.gte": String(Math.min(minVotes, 10)) });
  if (sort === "top") Object.assign(params, { sort_by: "vote_average.desc", "vote_count.gte": String(topVotes) });
  if (decade === "older") params[`${date}.lte`] = "1989-12-31";
  else if (decade) {
    const start = Number(decade.slice(0, 4));
    params[`${date}.gte`] = `${start}-01-01`;
    // Keep "Newest" from listing unreleased titles in the current decade.
    params[`${date}.lte`] = sort === "new" && decade === "2020s" ? TODAY : `${start + 9}-12-31`;
  }
  return { path: `/discover/${type}`, params };
}
