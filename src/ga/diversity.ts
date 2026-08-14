import type { Individual } from "../types";

// 平均ペアワイズハミング距離を染色体長で正規化した多様性指標
// 理論最大値は n/(2*(n-1))。n=30 では約 0.517、n→∞ で 0.5 に収束
// 各ビット位置で 1 の個数 k を数えれば k*(n-k) が「そのビットで差がある個体ペア数」になる
export function calcDiversity(population: Individual[]): number {
  const n = population.length;
  // eslint-disable-next-line no-magic-numbers
  if (n < 2) {
    return 0;
  }
  const L = population[0].length;
  if (L === 0) {
    return 0;
  }
  let totalDiff = 0;
  for (let p = 0; p < L; p++) {
    let ones = 0;
    for (const ind of population) {
      if (ind[p] === "1") {
        ones++;
      }
    }
    totalDiff += ones * (n - ones);
  }
  // eslint-disable-next-line no-magic-numbers
  const pairs = (n * (n - 1)) / 2;
  return totalDiff / pairs / L;
}
