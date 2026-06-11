import { describe, expect, it } from "vitest";
import { isoWeekKey, isoWeekOf, monthKey, prevMonthKey, ytdStart } from "../src/iso.ts";

describe("iso week", () => {
  it("isoWeekOf — first week of January 2026 is week 01", () => {
    expect(isoWeekOf(new Date("2026-01-05T00:00:00Z"))).toBe(2);
    // Jan 1 2026 is a Thursday — ISO week 1
    expect(isoWeekOf(new Date("2026-01-01T00:00:00Z"))).toBe(1);
  });

  it("isoWeekOf — week 53 boundary", () => {
    // Dec 30 2024 → ISO week 1 of 2025 (Mon)
    expect(isoWeekOf(new Date("2024-12-30T00:00:00Z"))).toBe(1);
  });

  it("isoWeekKey — formats with year-W## padding", () => {
    expect(isoWeekKey(new Date("2026-01-05T00:00:00Z"))).toBe("2026-W02");
  });
});

describe("monthKey", () => {
  it("formats YYYY-MM with zero-pad", () => {
    expect(monthKey(new Date("2026-01-15T12:00:00Z"))).toBe("2026-01");
    expect(monthKey(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12");
  });
});

describe("prevMonthKey", () => {
  it("June 1 returns May", () => {
    // Important: this is the rollover edge case. On Jun 1 the dashboard's
    // "previous month" charts must auto-advance to May, not show April.
    expect(prevMonthKey(new Date("2026-06-01T12:00:00Z"))).toBe("2026-05");
  });

  it("June 15 also returns May", () => {
    expect(prevMonthKey(new Date("2026-06-15T12:00:00Z"))).toBe("2026-05");
  });

  it("January 1 returns previous December", () => {
    expect(prevMonthKey(new Date("2026-01-01T12:00:00Z"))).toBe("2025-12");
  });
});

describe("ytdStart", () => {
  it("returns Jan 1 of input year UTC", () => {
    const start = ytdStart(new Date("2026-08-15T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
