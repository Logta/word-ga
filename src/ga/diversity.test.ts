import { describe, it, expect } from "vitest";

import { calcDiversity } from "./diversity";

describe("calcDiversity", () => {
  it("全個体が同一のとき 0 を返す", () => {
    expect(calcDiversity(["0000", "0000", "0000"])).toBe(0);
  });

  it("個体数 1 のとき 0 を返す", () => {
    expect(calcDiversity(["1010"])).toBe(0);
  });

  it("完全に相補的な2個体のとき最大値 1.0 を返す（n=2 の理論最大値は n/(2*(n-1))=1.0）", () => {
    expect(calcDiversity(["0000", "1111"])).toBeCloseTo(1);
  });

  it("結果は 0 以上 n/(2*(n-1)) 以下", () => {
    const pop = ["10101010", "01010101", "11001100", "00110011"];
    const n = pop.length;
    const theoreticalMax = n / (2 * (n - 1));
    const d = calcDiversity(pop);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(theoreticalMax + 1e-10);
  });

  it("ランダムな集団は 0.5 に近い多様性を持つ（確率的）", () => {
    // 30個体 × 100ビットのランダム集団
    const pop = Array.from({ length: 30 }, () =>
      Array.from({ length: 100 }, () => (Math.random() < 0.5 ? "0" : "1")).join(""),
    );
    expect(calcDiversity(pop)).toBeGreaterThan(0.35);
  });
});
