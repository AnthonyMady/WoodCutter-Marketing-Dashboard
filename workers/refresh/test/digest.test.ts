import { describe, expect, it } from "vitest";
import { mtdMomYoyRanges } from "../src/aggregate.ts";

// Reproduce the date math from weekly_digest.py.

describe("mtdMomYoyRanges", () => {
  it("running on June 1 2026 → MTD = May 2026", () => {
    const now = new Date("2026-06-01T08:00:00Z");
    const r = mtdMomYoyRanges(now);

    const mtdStart = new Date(r.mtd.from * 1000);
    const mtdEnd = new Date(r.mtd.to * 1000);
    expect(mtdStart.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(mtdEnd.toISOString().slice(0, 10)).toBe("2026-05-31");
  });

  it("running on June 15 2026 → MTD = June 1–14 2026", () => {
    const now = new Date("2026-06-15T08:00:00Z");
    const r = mtdMomYoyRanges(now);
    const mtdStart = new Date(r.mtd.from * 1000);
    const mtdEnd = new Date(r.mtd.to * 1000);
    expect(mtdStart.toISOString().slice(0, 10)).toBe("2026-06-01");
    expect(mtdEnd.toISOString().slice(0, 10)).toBe("2026-06-14");
  });

  it("running on March 31 → MoM caps at last day of February (28 days)", () => {
    const now = new Date("2026-04-01T08:00:00Z"); // ref = March 31
    const r = mtdMomYoyRanges(now);
    const momStart = new Date(r.mom.from * 1000);
    const momEnd = new Date(r.mom.to * 1000);
    expect(momStart.toISOString().slice(0, 10)).toBe("2026-02-01");
    // Feb 28 2026 (not a leap year)
    expect(momEnd.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("YoY references same month last year", () => {
    const now = new Date("2026-06-15T08:00:00Z");
    const r = mtdMomYoyRanges(now);
    const yoyStart = new Date(r.yoy.from * 1000);
    const yoyEnd = new Date(r.yoy.to * 1000);
    expect(yoyStart.toISOString().slice(0, 10)).toBe("2025-06-01");
    expect(yoyEnd.toISOString().slice(0, 10)).toBe("2025-06-14");
  });
});
