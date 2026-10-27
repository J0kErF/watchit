import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  categoriesFor,
  categoryPath,
  categoryQuery,
  findCategory,
  findSub,
  parseDecade,
  parseSort,
} from "./categories";
import { t } from "./i18n";
import { TODAY } from "./types";

const horror = findCategory("movie", "horror")!;
const arabic = findCategory("series", "arabic")!;

describe("categories", () => {
  it("have unique slugs, and subcategories too", () => {
    for (const list of Object.values(CATEGORIES)) {
      const slugs = list.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const c of list) {
        const subs = (c.subs ?? []).map((s) => s.slug);
        expect(new Set(subs).size).toBe(subs.length);
      }
    }
  });

  it("are all translated", () => {
    for (const c of Object.values(CATEGORIES).flat()) {
      for (const label of [c.label, ...(c.subs ?? []).map((s) => s.label)]) {
        expect(t("ar", label), label).not.toBe(label);
        expect(t("he", label), label).not.toBe(label);
      }
    }
  });

  it("link to their pages", () => {
    expect(categoryPath("movie", "horror")).toBe("/movies/horror");
    expect(categoryPath("series", "arabic")).toBe("/series/arabic");
  });

  it("list only kids categories in Kids mode", () => {
    const kids = categoriesFor("movie", true).map((c) => c.slug);
    expect(kids).toContain("animation");
    expect(kids).not.toContain("horror");
    expect(categoriesFor("movie", false)).toHaveLength(CATEGORIES.movie.length);
  });

  it("find subcategories by slug", () => {
    expect(findSub(arabic, "egyptian")?.filter).toEqual({ with_origin_country: "EG" });
    expect(findSub(arabic, "nope")).toBeUndefined();
    expect(findSub(arabic, "")).toBeUndefined();
    expect(findSub(arabic, null)).toBeUndefined();
  });
});

describe("parseSort and parseDecade", () => {
  it("accept known values and default otherwise", () => {
    expect(parseSort("top")).toBe("top");
    expect(parseSort("bogus")).toBe("popular");
    expect(parseDecade("1990s")).toBe("1990s");
    expect(parseDecade("1880s")).toBe("");
  });
});

describe("categoryQuery", () => {
  it("lists every horror movie by popularity", () => {
    const { path, params } = categoryQuery("movie", horror, "popular", "");
    expect(path).toBe("/discover/movie");
    expect(params).toMatchObject({ with_genres: "27", sort_by: "popularity.desc", "vote_count.gte": "0" });
  });

  it("still needs real votes to rank horror by rating", () => {
    expect(categoryQuery("movie", horror, "top", "").params["vote_count.gte"]).toBe("300");
  });

  it("adds a subcategory's filter to the category's", () => {
    const { params } = categoryQuery("series", arabic, "popular", "", findSub(arabic, "syrian"));
    expect(params).toMatchObject({ with_original_language: "ar", with_origin_country: "SY", "vote_count.gte": "1" });
    expect(params.without_genres).toBe("10763,10764,10767");
  });

  it("limits a decade, and keeps Newest to released titles", () => {
    expect(categoryQuery("movie", horror, "popular", "1990s").params).toMatchObject({
      "primary_release_date.gte": "1990-01-01",
      "primary_release_date.lte": "1999-12-31",
    });
    expect(categoryQuery("series", arabic, "new", "2020s").params["first_air_date.lte"]).toBe(TODAY);
    expect(categoryQuery("movie", horror, "popular", "older").params["primary_release_date.lte"]).toBe("1989-12-31");
  });

  it("limits Kids mode to kids ratings", () => {
    const animation = findCategory("movie", "animation")!;
    expect(categoryQuery("movie", animation, "popular", "", undefined, true).params).toMatchObject({
      certification_country: "US",
      "certification.lte": "PG",
    });
    const series = findCategory("series", "animation")!;
    expect(categoryQuery("series", series, "popular", "", undefined, true).params.certification).toBe("TV-Y|TV-Y7|TV-G");
  });
});
