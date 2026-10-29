import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";
import { episodeKey } from "./library";

describe("formatDuration", () => {
  it("shows hours and minutes, or minutes alone", () => {
    expect(formatDuration(8100)).toBe("2h 15m");
    expect(formatDuration(2700)).toBe("45m");
  });

  it("is empty without a duration", () => {
    expect(formatDuration(undefined)).toBe("");
    expect(formatDuration(0)).toBe("");
  });

  it("speaks the interface language", () => {
    expect(formatDuration(2700, "he")).toBe("45 ד׳");
    expect(formatDuration(8100, "ar")).toBe("2 س 15 د");
  });
});

describe("episodeKey", () => {
  it("names an episode by season and number", () => {
    expect(episodeKey({ index: 7, season: 2, number: 3 })).toBe("2x3");
  });

  it("falls back to the position for episodes without numbers", () => {
    expect(episodeKey({ index: 0 })).toBe("1x1");
  });
});
