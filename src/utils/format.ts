// 表示用のパーセント整形（比率 0..1 を % スケールへ）
// 各コンポーネントに散在していた (x * 100).toFixed(n) パターンの一元化

// eslint-disable-next-line no-magic-numbers
const PERCENT = 100;

export function toPercent(ratio: number): number {
  return ratio * PERCENT;
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${toPercent(ratio).toFixed(digits)}%`;
}
