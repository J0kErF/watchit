import { describe, expect, it } from "vitest";
import { allowedForKids, isFamily, parseKids } from "./kids";

describe("isFamily", () => {
  it("counts kids and family genres", () => {
    expect(isFamily("tv", [10762])).toBe(true);
    expect(isFamily("movie", [10751, 12])).toBe(true);
  });

  it("counts animated movies unless they're horror, thrillers or crime", () => {
    expect(isFamily("movie", [16, 35])).toBe(true);
    expect(isFamily("movie", [16, 27])).toBe(false);
  });

  it("doesn't count animated series, which are often for adults", () => {
    expect(isFamily("tv", [16, 35])).toBe(false);
  });
});

describe("allowedForKids", () => {
  it("allows kids ratings", () => {
    expect(allowedForKids({ certification: "PG" })).toBe(true);
    expect(allowedForKids({ certification: "TV-Y7" })).toBe(true);
  });

  it("blocks older ratings, even for family titles", () => {
    expect(allowedForKids({ certification: "PG-13", family: true })).toBe(false);
    expect(allowedForKids({ certification: "TV-MA" })).toBe(false);
  });

  it("allows unrated family titles, and nothing else unrated", () => {
    expect(allowedForKids({ family: true })).toBe(true);
    expect(allowedForKids({})).toBe(false);
  });
});

it("parseKids reads the cookie", () => {
  expect(parseKids("1")).toBe(true);
  expect(parseKids("0")).toBe(false);
  expect(parseKids(undefined)).toBe(false);
});
