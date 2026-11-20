import { describe, expect, it } from "vitest";
import { bktUpdate } from "./learning";

describe("BKT mastery posterior", () => {
  it("correct answers raise the posterior, wrong answers lower it", () => {
    const start = 0.25;
    const afterRight = bktUpdate(start, true);
    const afterWrong = bktUpdate(start, false);
    expect(afterRight).toBeGreaterThan(start);
    expect(afterWrong).toBeLessThan(start);
  });
  it("repeated successes converge towards mastery", () => {
    let p = 0.25;
    for (let i = 0; i < 12; i++) p = bktUpdate(p, true);
    expect(p).toBeGreaterThan(0.9);
  });
  it("stays within probability bounds", () => {
    let p = 0.1;
    for (let i = 0; i < 30; i++) p = bktUpdate(p, i % 3 === 0);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });
});
