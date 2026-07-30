import { describe, expect, it } from "vitest";
import { buildCrossSeries, seriesChangePercent } from "../rate-history";

const BTC = { "2026-01-01": 40000, "2026-01-02": 50000 };
const EUR = { "2026-01-01": 1.1, "2026-01-02": 1.2 };

describe("buildCrossSeries", () => {
  it("divides one USD series by the other", () => {
    expect(buildCrossSeries("BTC", "EUR", BTC, EUR)).toEqual([
      { date: "2026-01-01", rate: 40000 / 1.1 },
      { date: "2026-01-02", rate: 50000 / 1.2 },
    ]);
  });

  it("treats USD as a constant 1 on the give side", () => {
    expect(buildCrossSeries("USD", "BTC", {}, BTC)).toEqual([
      { date: "2026-01-01", rate: 1 / 40000 },
      { date: "2026-01-02", rate: 1 / 50000 },
    ]);
  });

  it("treats USD as a constant 1 on the receive side", () => {
    expect(buildCrossSeries("BTC", "USD", BTC, {})).toEqual([
      { date: "2026-01-01", rate: 40000 },
      { date: "2026-01-02", rate: 50000 },
    ]);
  });

  it("keeps only days present on both sides", () => {
    const partialEur = { "2026-01-02": 1.2 };
    expect(buildCrossSeries("BTC", "EUR", BTC, partialEur)).toEqual([
      { date: "2026-01-02", rate: 50000 / 1.2 },
    ]);
  });

  it("returns nothing when both sides are the same currency", () => {
    expect(buildCrossSeries("BTC", "BTC", BTC, BTC)).toEqual([]);
  });

  it("skips days with a non-positive or non-finite price", () => {
    const broken = { "2026-01-01": 0, "2026-01-02": Number.NaN, "2026-01-03": 100 };
    const other = { "2026-01-01": 2, "2026-01-02": 2, "2026-01-03": 2 };
    expect(buildCrossSeries("BTC", "EUR", broken, other)).toEqual([
      { date: "2026-01-03", rate: 50 },
    ]);
  });

  it("sorts the result chronologically", () => {
    const unordered = { "2026-01-03": 300, "2026-01-01": 100 };
    const dates = buildCrossSeries("BTC", "USD", unordered, {}).map((p) => p.date);
    expect(dates).toEqual(["2026-01-01", "2026-01-03"]);
  });
});

describe("seriesChangePercent", () => {
  it("measures first to last", () => {
    expect(
      seriesChangePercent([
        { date: "a", rate: 100 },
        { date: "b", rate: 150 },
      ])
    ).toBeCloseTo(50);
  });

  it("handles a decline", () => {
    expect(
      seriesChangePercent([
        { date: "a", rate: 200 },
        { date: "b", rate: 150 },
      ])
    ).toBeCloseTo(-25);
  });

  it("returns null with fewer than two points", () => {
    expect(seriesChangePercent([])).toBeNull();
    expect(seriesChangePercent([{ date: "a", rate: 1 }])).toBeNull();
  });

  it("returns null when the baseline is unusable", () => {
    expect(
      seriesChangePercent([
        { date: "a", rate: 0 },
        { date: "b", rate: 5 },
      ])
    ).toBeNull();
  });
});
