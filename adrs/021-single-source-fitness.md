# ADR-021: fitness計算を各層で一度だけ行い、結果を単一ソースとして共有する

**Status**: Proposed

## Context

コードレビューで、同一世代の適応度が3つの層で独立に再計算されていることが判明した（POP_SIZE=30・染色体長100bitで世代あたり約2,100回の冗長な O(L) 評価）。

1. **MoonBit `evolve` の sort comparator**: 比較のたびに `calc_fitness` を2回呼ぶ（約300比較 × 2 = 600回）
2. **MoonBit `roulette_select`**: 選択のたびに全集団の適応度を再計算（世代あたり60選択 × 30 = 1,800回、O(n²L)）
3. **TS 側**: `summarize` が30回の wasm 越境で fits を計算して捨て、`App.tsx` の `sorted` computed がさらに30回再計算（`encode(state.target)` も個体毎に再実行）

設計面でも、`StatusBar` の `bestFit`（history 由来）と `bestInd`（App の computed 由来）の出所が分裂しており、片方だけ変更すると画面内で数値と個体表示が食い違う構造だった。

あわせて、選択戦略のシグネチャが不統一（`elite_select(pop)` / `roulette_select(pop, target)`）で、dispatch 側がクロージャで場当たり的に差異を吸収していた（ADR-014/015 の実装上の綻び）。

## Decision

**各層で fitness を一度だけ計算し、以後は計算結果を受け渡す。**

### MoonBit 側

- `evolve` 冒頭で全個体の fits を1回計算し、`(individual, fitness)` ペアを適応度降順にソート
- 選択戦略を統一シグネチャ **`fn(pop : Array[String], fits : Array[Double]) -> String`** に揃える（**ADR-014 の改訂**）。`elite_select` は fits を使わないが、シグネチャ統一により dispatch は関数参照を直接返せる
- `roulette_select` は受け取った fits を使い、再計算を廃止

### TS 側

- `SimState` に **`fits: number[]`**（population と並行な適応度配列）を追加し、`summarize` の計算結果を保持する（データ構造変更）
- `App.tsx` の `sorted` は保持済み fits の zip + ソートだけを行い、wasm 越境ゼロの表示専任にする
- `StatusBar` の `bestFit` / `bestInd` は同一の `sorted` から取り、出所を一本化
- `core.ts` の `calcFitness` 再エクスポートは利用箇所が消えるため削除

## Consequences

- 世代あたりの適応度評価が約2,130回 → 30回に、JS↔Wasm 越境が60回 → 30回になる
- 表示系（best 個体と best 適応度）が単一ソースになり、食い違いが構造的に起きなくなる
- `SimState` の形が変わるため、特性化テストのスナップショットは正当な更新が必要
- ソート順序の意味論（適応度降順）がホワイトボックステストで直接固定できるようになる（従来は breeding 出力越しにしか観測できなかった）
