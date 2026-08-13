/**
 * テスト用の参照実装: 文字ごとの一致率を計算する。
 * wasmCalcFitness のモック実装として core.test.ts / useSimulator.test.ts から共有する。
 */
export function referenceFitness(ind: string, target: string): number {
  let m = 0;
  for (let i = 0; i < target.length; i++) {
    if (ind[i] === target[i]) {
      m++;
    }
  }
  return m / target.length;
}
