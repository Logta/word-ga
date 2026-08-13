# リポジトリ全体のリファクタリング設計

**日付**: 2026-08-13
**ステータス**: Approved

## 背景・目的

ユーザーから「リポジトリ全体を徹底的にリファクタリングしてください」という依頼を受けた。事前調査の結果、リポジトリ自体は小規模（TS/TSX約1,833行、MoonBit約200行）で比較的整理されているが、以下の重複・死んだコードが見つかった。

ユーザーへのヒアリングで方向性を確認：
- 発端となった具体的な不満は特にない。全体を一周見て改善点を探してほしい
- とにかくコード量を減らしたい・シンプルにしたい
- テストの質や構造を見直したい
- 対象範囲: TS/Vue側 + MoonBit側の両方
- 制約: **振る舞い完全保持**（UI・GAの挙動は一切変えない。既存テストが検証する内容も変えない）

## スコープ

- 対象: `src/` （TS/Vue）、`moonbit/src/`（MoonBit）
- 非対象: wasm公開API・ADR-016のステートレス方針、Vueコンポーネントのprops宣言スタイル（プロジェクト全体で確立された規約）、UIの見た目・挙動
- 検証方法: 各変更後に `bun run build` / `bun run test` / `bun run lint` / `bun run fmt:check` が全て通ることを確認する

## 変更内容

### A. 不要コードの削除

ルートの `GeneticAlgorithmSim.tsx`（466行）を削除する。Vue移行（ADR-013）前のReact+rechartsプロトタイプの残骸で、`src/`のどこからもimportされていない。git履歴には残るため安全に削除できる。

### B. TS/Vue側の重複排除

1. **`src/ga/core.ts`**: `initState`/`stepState`が「集団のfits配列を計算 → best/avgを算出 → historyエントリーを生成」という処理をほぼ同一のコードで重複している。共通の`summarize(population, binTarget, generation): { best; avg; diversity; historyEntry }`のようなヘルパーに抽出し、両関数から呼び出す
2. **`PERCENT = 100`定数の重複**: `StatusBar.tsx` / `IndividualList.tsx` / `ConvergenceGraph.tsx`の3コンポーネントが同一の`const PERCENT = 100;`を個別に宣言している。`core.ts`に`export const PERCENT = 100;`として一本化し、3箇所からimportする
3. **`src/hooks/useSimulator.ts`**: インターバルのtick処理と`stepOnce()`アクションが`Object.assign(state, stepState({ ...state } as SimState))`を重複して持つ。共通のprivateヘルパー関数に抽出する。あわせて`{ ...state } as SimState`・`state as unknown as SimState`という二重キャストがVueの`reactive()`の型（`UnwrapNestedRefs`）に起因して発生しているため、より自然に書ける型の付け方がないか実装時に検討する（無理に変えず、安全に書き換えられる場合のみ変更）
4. **MoonBit**: `selection_roulette.mbt`のwhileループ内`i = i + 1`を、他ファイル（`individual.mbt`の`m += 1`）に合わせて`i += 1`に統一する（スタイル統一のみ、挙動は不変）

### C. テストの構造改善

1. **wasmBridgeモックの重複**: `vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));`という一字一句同じ行が、`Header.test.tsx` / `GeneDisplay.test.tsx` / `IndividualList.test.tsx` / `StatusBar.test.tsx`の4ファイルに重複している。vitest/jestの規約に沿い、モジュールに隣接する手動モック `src/ga/__mocks__/wasmBridge.ts` を作成し、各テストファイルは `vi.mock("../ga/wasmBridge")`（ファクトリなし）に簡略化する
2. **参照実装の重複**: `core.test.ts`の`calcFitnessRef`関数と`useSimulator.test.ts`のモックファクトリ内インライン実装が、どちらも「文字ごとの一致数 / 文字列長」という同一ロジックを個別実装している。共有テストヘルパー `src/testUtils/referenceFitness.ts` に抽出し、両ファイルからimportする
3. **chart.js/vue-chartjsモックの重複**: `App.test.tsx`と`ConvergenceGraph.test.tsx`がほぼ同一の`vi.mock("chart.js", ...)` / `vi.mock("vue-chartjs", ...)`ブロックを個別に持つ（差異はvue-chartjsモックの`data-testid`値とレンダリングするタグのみ）。調査の結果、`App.test.tsx`側はそのtestid値を一切アサーションで参照していないため、`ConvergenceGraph.test.tsx`が使う`data-testid="chart-canvas"` / `canvas`タグに統一しても両テストの検証内容は変わらない。ルートに `__mocks__/chart.js.ts` と `__mocks__/vue-chartjs.ts` を作成し、両テストファイルを`vi.mock("chart.js")` / `vi.mock("vue-chartjs")`に簡略化する
4. **新規テスト**: `src/ga/wasmBridge.ts`自体を直接検証するテストが存在しない（全テストがこのモジュールをモックしているため、SEPによるjoin/split処理や、未初期化時に`wasm()`が例外を投げるパスが一度もテストされていない）。`src/ga/wasmBridge.test.ts`を新規作成し、このモジュール固有のロジックをカバーする

## リスクと検証

- 全ての変更は内部構造の整理のみで、公開する関数シグネチャ・コンポーネントprops・UI・GA挙動は変えない
- 既存テストが検証する内容（アサーション対象）は変えない。テストファイルの構造整理・重複排除のみ行う
- 各変更ステップごとに `bun run build` / `bun run test` / `bun run lint` / `bun run fmt:check` を実行し、グリーンであることを確認してから次に進む
- MoonBit側の変更（B-4）は `mise run moon:test` / `mise run moon:build` でも確認する

## 対象外・やらないこと

- wasm公開API・ADR-016のステートレス方針の変更
- Vueコンポーネントのprops宣言（`PropType` + `required: true as const`）のスタイル変更
- UIの見た目・挙動の変更
- ライブラリ・フレームワークの追加/入れ替え
