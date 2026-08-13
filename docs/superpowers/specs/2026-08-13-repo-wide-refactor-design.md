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

### D. 特性化テスト（リファクタ前後の動作保証）

ユーザーからの追加要望:「ガッツリテストを書いて、リファクタ前後の動作差異がないことを保証してから作業する」。既存テストはプロパティベースの検証（値の範囲・型など）が中心で、`initState`/`stepState`/`useSimulator`の**完全な出力形状**までは固定していない。B-1・B-3で内部実装を変更する2箇所について、以下の手順でリファクタ前後の完全な出力一致を機械的に保証する。

**対象**: `src/ga/core.ts`の`initState`/`stepState`（B-1で`summarize()`抽出）、`src/hooks/useSimulator.ts`のtick処理（B-3でヘルパー抽出）

**手順**:
1. **①特性化テストを先に書く**（リファクタ前のコードに対して）
   - `Math.random`を`vi.spyOn`で固定シーケンスのシード付き擬似乱数に差し替え、`wasmCalcFitness`/`wasmEvolve`を決定的な実装でモックし、`initState`/`stepState`/`useSimulator`の呼び出し結果を完全に再現可能にする
   - vitestの`toMatchSnapshot()`（ファイルスナップショット）で戻り値オブジェクト全体を記録する。プロパティ単位のアサーションでは拾えない「構造そのものが変わっていないか」を機械的に保証できるため
   - `core.test.ts`に`describe("characterization")`ブロックを追加し、`initState`・`stepState`（複数世代分）それぞれのスナップショットを取得
   - `useSimulator.test.ts`にも同様に、`stepOnce`後・複数tick後の状態オブジェクト全体のスナップショットを追加
2. **②現在のコード（リファクタ前）に対してテストを実行し、スナップショットを確定・コミットする** — これがベースライン
3. **③B-1・B-3のリファクタを実施する**
4. **④同じ特性化テストを一切変更せずに再実行する** — スナップショットの差分が0件であることを確認する。差分が出た場合はリファクタ側のバグであり、スナップショットの更新（`-u`）で握り潰さず原因を修正する

`wasmBridge.ts`自体（C-4）はこの回で構造変更しないため特性化テストの対象外。MoonBit側のB-4はループの構文差（`i = i + 1` → `i += 1`）のみで意味的な変更が一切なく、既存のwhitebox test（30テスト・カバレッジ98.6%、`selection_roulette_wbtest.mbt`含む）が既に十分な安全網のため追加の特性化テストは行わない。

## リスクと検証

- 全ての変更は内部構造の整理のみで、公開する関数シグネチャ・コンポーネントprops・UI・GA挙動は変えない
- 既存テストが検証する内容（アサーション対象）は変えない。テストファイルの構造整理・重複排除のみ行う
- B-1・B-3については、D節の特性化テストによりリファクタ前後で出力が一切変わっていないことを機械的に保証してから完了とする
- 各変更ステップごとに `bun run build` / `bun run test` / `bun run lint` / `bun run fmt:check` を実行し、グリーンであることを確認してから次に進む
- MoonBit側の変更（B-4）は `mise run moon:test` / `mise run moon:build` でも確認する
- コミットは「①特性化テスト追加（ベースライン確定）」→「②リファクタ本体」を分け、スナップショットに差分が出ないことを②のコミット前に確認する

## 対象外・やらないこと

- wasm公開API・ADR-016のステートレス方針の変更
- Vueコンポーネントのprops宣言（`PropType` + `required: true as const`）のスタイル変更
- UIの見た目・挙動の変更
- ライブラリ・フレームワークの追加/入れ替え
