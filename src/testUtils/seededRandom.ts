/**
 * テスト用の決定的な擬似乱数生成器（Numerical Recipes 型 LCG）。
 * `vi.spyOn(Math, "random").mockImplementation(createSeededRandom(seed))` の形で使う。
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // eslint-disable-next-line no-magic-numbers
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    // eslint-disable-next-line no-magic-numbers
    return state / 4294967296;
  };
}
