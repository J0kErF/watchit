/**
 * Kids mode: a cookie set by the navbar switch. Lists from /discover are limited to US kids ratings;
 * other lists (trending, search, recommendations) keep only family titles, and title pages need a
 * kids rating. Titles without a US rating (most Arabic and Turkish ones) are left out.
 */
export const KIDS_COOKIE = "jawy-kids";

export const parseKids = (value?: string | null) => value === "1";

// TMDb genre ids.
const FAMILY = 10751;
const KIDS = 10762;
const ANIMATION = 16;
const NOT_FOR_KIDS = [27, 53, 80]; // horror, thriller, crime

/** Whether TMDb's genres mark a title as made for children or families. */
export function isFamily(type: "movie" | "tv", genreIds: number[]) {
  if (genreIds.includes(KIDS) || genreIds.includes(FAMILY)) return true;
  return type === "movie" && genreIds.includes(ANIMATION) && !genreIds.some((g) => NOT_FOR_KIDS.includes(g));
}

const KIDS_RATINGS = new Set(["G", "PG", "TV-Y", "TV-Y7", "TV-Y7-FV", "TV-G"]);
const OLDER_RATINGS = new Set(["PG-13", "R", "NC-17", "TV-PG", "TV-14", "TV-MA"]);

/** Whether a title may open in Kids mode: a kids rating, or a family title with no older rating. */
export function allowedForKids(title: { certification?: string; family?: boolean }) {
  if (title.certification && KIDS_RATINGS.has(title.certification)) return true;
  return Boolean(title.family) && !(title.certification && OLDER_RATINGS.has(title.certification));
}

/** /discover filters that keep a list to kids ratings. */
export const kidsFilter = (type: "movie" | "tv"): Record<string, string> =>
  type === "movie"
    ? { certification_country: "US", "certification.lte": "PG" }
    : { certification_country: "US", certification: "TV-Y|TV-Y7|TV-G" };
