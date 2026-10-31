# ADR-022: mutation testing を手動実行のツールとして導入する

**Status**: Accepted

## Context

カバレッジ（TS 約 92%）は「実行された行」しか示さず、テストが誤った振る舞いを検出できるかは分からない。
実際に計測すると、交叉点の境界・突然変異率・選択確率の比率・タイマー解除など、壊しても既存テストが通る箇所が見つかった。

MoonBit には mutation testing ツールが存在しない。また TS 側のテストランナーは vitest だが、Stryker の vitest-runner は
Bun ランタイムでは読み込みに失敗し、TypeScript 7（ネイティブ版）は Stryker が tsconfig 書き換えに使う JS API を持たない。

## Decision

- **TS**: `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` を devDependency に追加し、`stryker.config.mjs` で
  中核ロジック（`src/ga/*.ts`、`src/hooks/useSimulator.ts`、`src/utils/format.ts`）だけを対象にする。
  Node で実行し（`mise run test:mutation`。mise の task 単位で Node 26.13.0 を指定）、`tsconfigFile: ""` で tsconfig 書き換えを無効化する。
- **MoonBit**: `scripts/moonbit-mutation.mjs` で演算子・比較・数値/文字定数・範囲境界・`break` を 1 つずつ置換し、
  `moon test --target wasm-gc` を回す簡易実装を用いる（`mise run moon:mutation`）。作業ツリーは書き換えず一時ディレクトリで行う。
- どちらも重いため CI の必須ジョブにはせず、手動実行とする。レポートは `reports/`（gitignore）に出す。

## Consequences

- 生存 mutant を手がかりに、振る舞い（分布・境界・ライフサイクル）を検証するテストを追加できる
- 等価 mutant（例: 対称な `random_bit` の 0/1 入れ替え、確率 0 の境界 `<` → `<=`）は生存として残るため、スコアは 100% にならない
- Stryker の対応状況（Bun ランタイム、TypeScript 7 の API）が改善したら、設定の回避策を外せる
