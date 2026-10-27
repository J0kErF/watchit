import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { langDir, parseLang, t, tmdbLanguage, translated } from "./i18n";

describe("t", () => {
  it("returns English as written", () => {
    expect(t("en", "Movies")).toBe("Movies");
  });

  it("translates to Arabic and Hebrew", () => {
    expect(t("ar", "Movies")).toBe("أفلام");
    expect(t("he", "Movies")).toBe("סרטים");
  });

  it("falls back to English when there's no translation", () => {
    expect(t("he", "Some text nobody translated")).toBe("Some text nobody translated");
  });

  it("tells which texts have a translation", () => {
    expect(translated("ar", "Syrian series")).toBe(true);
    expect(translated("he", "Anime series")).toBe(false);
    expect(translated("en", "Anything")).toBe(true);
  });

  it("fills in placeholders, and leaves unknown ones", () => {
    expect(t("en", "Season {n}", { n: 2 })).toBe("Season 2");
    expect(t("he", "Season {n}", { n: 2 })).toBe("עונה 2");
    expect(t("en", "{h}h {m}m", { h: 1 })).toBe("1h {m}m");
  });
});

describe("language settings", () => {
  it("parses the cookie, defaulting to English", () => {
    expect(parseLang("ar")).toBe("ar");
    expect(parseLang("he")).toBe("he");
    expect(parseLang("fr")).toBe("en");
    expect(parseLang(undefined)).toBe("en");
  });

  it("runs Arabic and Hebrew right to left", () => {
    expect(langDir("en")).toBe("ltr");
    expect(langDir("ar")).toBe("rtl");
    expect(langDir("he")).toBe("rtl");
  });

  it("asks TMDb for the matching language", () => {
    expect(tmdbLanguage("en")).toBe("en-US");
    expect(tmdbLanguage("he")).toBe("he");
  });
});

describe("translation tables", () => {
  // The tables aren't exported, so their keys are read from the source.
  const source = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");
  const keys = (name: string) => {
    const body = source.slice(source.indexOf(`const ${name}: Record<string, string> = {`)).split("\n};")[0];
    return new Set([...body.matchAll(/^\s+(?:"((?:[^"\\]|\\.)*)"|([\w]+)):/gm)].map((m) => m[1] ?? m[2]));
  };

  it("translate the same strings in Arabic and Hebrew", () => {
    const ar = keys("AR");
    const he = keys("HE");
    expect(ar.size).toBeGreaterThan(100);
    expect([...ar].filter((k) => !he.has(k))).toEqual([]);
    expect([...he].filter((k) => !ar.has(k))).toEqual([]);
  });

  it("keep every placeholder in the translation", () => {
    for (const lang of ["ar", "he"] as const) {
      for (const key of keys("AR")) {
        const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
        expect(placeholders(t(lang, key)), `${lang}: ${key}`).toEqual(placeholders(key));
      }
    }
  });
});
