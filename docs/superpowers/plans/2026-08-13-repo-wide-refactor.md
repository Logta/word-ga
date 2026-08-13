# リポジトリ全体リファクタリング Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** リポジトリ全体（TS/Vue側 + MoonBit側）の重複コード・死んだコード・テストの重複を、振る舞いを一切変えずに整理する。

**Architecture:** 既存のADR-016（wasmステートレス方針）・ADR-014（差し替え可能な選択戦略）を変えない範囲での内部リファクタリング。テストの重複はvitestの手動モック（`__mocks__`ディレクトリ）と共有テストヘルパーで解消する。`initState`/`stepState`/`useSimulator`のtick処理という「実装を変える2箇所」については、リファクタ前に決定的な特性化テスト（乱数を固定し、vitestスナップショットで完全な出力を記録）を書き、リファクタ後に同じテストを無変更で再実行して差分0件を確認する。

**Tech Stack:** TypeScript 7 / Vue 3 (TSX) / vitest 4 / MoonBit（wasm-gc）/ oxlint / oxfmt / bun

## Global Constraints

- **振る舞い完全保持**: UI・GAの挙動、公開する関数シグネチャ・コンポーネントprops・wasm公開APIは一切変えない
- **既存テストのアサーション対象は変えない**: テストファイルの構造整理・重複排除のみ行う（何を検証しているかは変えない）
- 各タスクのステップ完了後、該当範囲で `bun run build` / `bun run test` / `bun run lint` / `bun run fmt:check` を実行しグリーンであることを確認する
- MoonBit側を変更するタスクは `mise run moon:test` / `mise run moon:build` でも確認する
- oxlintの設定（`oxlint.json`）には `**/*.test.ts` / `**/*.test.tsx` に対する `no-magic-numbers: off` のoverrideが既にあるため、テストファイル内の数値リテラルに `eslint-disable` コメントは不要（`src/testUtils/`・`src/ga/__mocks__/`など非テストファイルでは必要）
- `bun run lint` / `bun run fmt` はどちらも `src/` 配下のみを対象にしている（`package.json`参照）。リポジトリルート直下に作成する `__mocks__/chart.js.ts` / `__mocks__/vue-chartjs.ts` はこのスコープ外だが、既存コードのスタイル（ダブルクォート・2スペースインデント）に合わせて手書きする
- コミットは各タスクの最後にまとめて1つ（タスクをまたぐ巨大コミットにしない）

---

## File Structure

**新規作成:**
- `src/ga/__mocks__/wasmBridge.ts` — `wasmBridge`モジュールの手動モック（vitest規約）
- `src/testUtils/referenceFitness.ts` — `wasmCalcFitness`モックの参照実装（文字一致率計算）を共有
- `src/testUtils/seededRandom.ts` — 特性化テスト用の決定的な擬似乱数生成器
- `__mocks__/chart.js.ts`（リポジトリルート） — `chart.js`パッケージの手動モック
- `__mocks__/vue-chartjs.ts`（リポジトリルート） — `vue-chartjs`パッケージの手動モック
- `src/ga/wasmBridge.test.ts` — `wasmBridge.ts`自体の新規テスト

**変更:**
- `src/ga/core.ts` — `summarize()`ヘルパー抽出、`PERCENT`定数を追加
- `src/hooks/useSimulator.ts` — tick処理の共通ヘルパー抽出
- `src/components/StatusBar.tsx` / `IndividualList.tsx` / `ConvergenceGraph.tsx` — ローカルの`PERCENT`定数を`core.ts`からのimportに置き換え
- `src/components/Header.test.tsx` / `GeneDisplay.test.tsx` / `IndividualList.test.tsx` / `StatusBar.test.tsx` — `vi.mock`呼び出しを手動モック利用に簡略化
- `src/ga/core.test.ts` — `calcFitnessRef`を共有ヘルパーに置き換え、特性化テストを追加
- `src/hooks/useSimulator.test.ts` — モックファクトリを手動モック+共有ヘルパーに置き換え、特性化テストを追加
- `src/App.test.tsx` / `src/components/ConvergenceGraph.test.tsx` — chart.js/vue-chartjsモックを手動モック利用に簡略化
- `moonbit/src/selection_roulette.mbt` — `i = i + 1` → `i += 1`
- `vite.config.ts` — カバレッジ除外対象に`src/testUtils/**`・`src/ga/__mocks__/**`を追加

**削除:**
- `GeneticAlgorithmSim.tsx`（リポジトリルート）

---

### Task 1: 死んだコードの削除

**Files:**
- Delete: `GeneticAlgorithmSim.tsx`

**Interfaces:** なし（他タスクに依存しない独立タスク）

- [ ] **Step 1: どこからも参照されていないことを再確認する**

Run: `grep -rl "GeneticAlgorithmSim" /Users/tito/repos/word-ga/src /Users/tito/repos/word-ga/index.html /Users/tito/repos/word-ga/package.json /Users/tito/repos/word-ga/vite.config.ts`
Expected: 出力なし（マッチなし）

- [ ] **Step 2: ファイルを削除する**

```bash
git rm GeneticAlgorithmSim.tsx
```

- [ ] **Step 3: ビルド・テスト・lintがグリーンであることを確認する**

Run: `bun run build && bun run test --run && bun run lint`
Expected: 全てPASS（`GeneticAlgorithmSim.tsx`はビルドグラフに含まれていなかったため影響なし）

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: Vue移行前のReactプロトタイプ残骸を削除

GeneticAlgorithmSim.tsx はどこからもimportされていない、Vue移行
(ADR-013)前のReact+rechartsプロトタイプの残骸だった。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: wasmBridgeモックの手動モック化

**Files:**
- Create: `src/ga/__mocks__/wasmBridge.ts`
- Modify: `src/components/Header.test.tsx`
- Modify: `src/components/GeneDisplay.test.tsx`
- Modify: `src/components/IndividualList.test.tsx`
- Modify: `src/components/StatusBar.test.tsx`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: 既存の`src/ga/wasmBridge.ts`が`wasmCalcFitness(ind: string, target: string): number`・`wasmEvolve(population: string[], target: string, selectionMethod?: SelectionMethod): string[]`をexportしている
- Produces: `src/ga/__mocks__/wasmBridge.ts`が`wasmCalcFitness`・`wasmEvolve`という名前の`vi.fn()`をexportする。以降のタスクで他のテストファイルからも`vi.mock("../ga/wasmBridge")`（ファクトリなし）で参照できる

- [ ] **Step 1: 手動モックファイルを作成する**

`src/ga/__mocks__/wasmBridge.ts`:
```ts
import { vi } from "vitest";

export const wasmCalcFitness = vi.fn();
export const wasmEvolve = vi.fn();
```

- [ ] **Step 2: Header.test.tsx を簡略化する**

`src/components/Header.test.tsx` の5行目を変更:

Before:
```ts
// Header.tsx が core.ts 経由で wasmBridge を参照するため CI 環境でも解決できるようモックする
vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));
```

After:
```ts
// Header.tsx が core.ts 経由で wasmBridge を参照するため CI 環境でも解決できるようモックする（手動モック: src/ga/__mocks__/wasmBridge.ts）
vi.mock("../ga/wasmBridge");
```

- [ ] **Step 3: GeneDisplay.test.tsx / IndividualList.test.tsx / StatusBar.test.tsx も同様に簡略化する**

3ファイルそれぞれの該当行（コメント文言はファイルごとに既存のものをそのまま維持し、`vi.mock`呼び出しのみ変更）:

Before（3ファイル共通）:
```ts
vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));
```

After（3ファイル共通）:
```ts
vi.mock("../ga/wasmBridge");
```

- [ ] **Step 4: vite.config.ts のカバレッジ除外に新規ディレクトリを追加する**

`vite.config.ts` の `coverage.exclude` 配列を変更:

Before:
```ts
      exclude: ["src/main.tsx", "src/**/*.d.ts", "src/**/*.test.*"],
```

After:
```ts
      exclude: [
        "src/main.tsx",
        "src/**/*.d.ts",
        "src/**/*.test.*",
        "src/testUtils/**",
        "src/ga/__mocks__/**",
      ],
```

- [ ] **Step 5: 4つのテストファイルとカバレッジ設定が正しく動作することを確認する**

Run: `bun run test --run src/components/Header.test.tsx src/components/GeneDisplay.test.tsx src/components/IndividualList.test.tsx src/components/StatusBar.test.tsx`
Expected: 全てPASS（既存のテスト数・アサーションは変えていないため件数は変わらない）

Run: `bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: wasmBridgeモックを手動モックに一本化

vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(),
wasmEvolve: vi.fn() })) という一字一句同じ行が4テストファイルに
重複していた。vitest規約の手動モック(src/ga/__mocks__/wasmBridge.ts)
に一本化し、各テストファイルは vi.mock("../ga/wasmBridge") に簡略化。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 参照実装（fitness計算）の共通化

**Files:**
- Create: `src/testUtils/referenceFitness.ts`
- Modify: `src/ga/core.test.ts`
- Modify: `src/hooks/useSimulator.test.ts`

**Interfaces:**
- Produces: `referenceFitness(ind: string, target: string): number` — 文字ごとの一致数 / target.length を返す純関数。以降のタスク（特性化テスト含む）でも共有する

- [ ] **Step 1: 共有ヘルパーを作成する**

`src/testUtils/referenceFitness.ts`:
```ts
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
```

- [ ] **Step 2: core.test.ts を共有ヘルパー利用に変更する**

`src/ga/core.test.ts` の import文とローカル関数定義を変更:

Before（1〜35行目付近）:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  initState,
  stepState,
  calcDiversity,
  CHARS,
  POP_SIZE,
  MUTATION_RATE,
  ELITE_RATIO,
  charToBin,
  binToChar,
  encode,
  decode,
} from "./core";
import * as wasmBridge from "./wasmBridge";

// wasmBridgeをモック（Wasm不要）
vi.mock("./wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));

// 参照実装：文字一致率を計算
function calcFitnessRef(ind: string, target: string): number {
  let m = 0;
  for (let i = 0; i < target.length; i++) {
    if (ind[i] === target[i]) {
      m++;
    }
  }
  return m / target.length;
}

beforeEach(() => {
  vi.mocked(wasmBridge.wasmCalcFitness).mockImplementation(calcFitnessRef);
  vi.mocked(wasmBridge.wasmEvolve).mockImplementation((pop) => [...pop]);
});
```

After:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  initState,
  stepState,
  calcDiversity,
  CHARS,
  POP_SIZE,
  MUTATION_RATE,
  ELITE_RATIO,
  charToBin,
  binToChar,
  encode,
  decode,
} from "./core";
import * as wasmBridge from "./wasmBridge";
import { referenceFitness } from "../testUtils/referenceFitness";

// wasmBridgeをモック（Wasm不要）
vi.mock("./wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));

beforeEach(() => {
  vi.mocked(wasmBridge.wasmCalcFitness).mockImplementation(referenceFitness);
  vi.mocked(wasmBridge.wasmEvolve).mockImplementation((pop) => [...pop]);
});
```

（ファイル後半の`describe`ブロック群はそのまま変更しない）

- [ ] **Step 3: useSimulator.test.ts を手動モック + 共有ヘルパー利用に変更する**

`src/hooks/useSimulator.test.ts` の先頭付近を変更:

Before（1〜40行目）:
```ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, afterEach } from "vitest";
import { defineComponent, nextTick } from "vue";

import { useSimulator } from "./useSimulator";

function renderHook<T>(composable: () => T) {
  let result!: T;
  const Wrapper = defineComponent({
    setup() {
      result = composable();
      return () => undefined;
    },
  });
  mount(Wrapper, { attachTo: document.createElement("div") });
  return {
    result: {
      get value() {
        return result;
      },
    },
  };
}

vi.mock("../ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn((ind: string, target: string) => {
    let m = 0;
    for (let i = 0; i < target.length; i++) {
      if (ind[i] === target[i]) {
        m++;
      }
    }
    return m / target.length;
  }),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
}));

afterEach(() => {
  vi.useRealTimers();
});
```

After:
```ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, nextTick } from "vue";

import { useSimulator } from "./useSimulator";
import * as wasmBridge from "../ga/wasmBridge";
import { referenceFitness } from "../testUtils/referenceFitness";

function renderHook<T>(composable: () => T) {
  let result!: T;
  const Wrapper = defineComponent({
    setup() {
      result = composable();
      return () => undefined;
    },
  });
  mount(Wrapper, { attachTo: document.createElement("div") });
  return {
    result: {
      get value() {
        return result;
      },
    },
  };
}

vi.mock("../ga/wasmBridge");

beforeEach(() => {
  vi.mocked(wasmBridge.wasmCalcFitness).mockImplementation(referenceFitness);
  vi.mocked(wasmBridge.wasmEvolve).mockImplementation((pop) => [...pop]);
});

afterEach(() => {
  vi.useRealTimers();
});
```

（ファイル後半の`describe`ブロック群はそのまま変更しない。`vi.mock("../ga/wasmBridge")`はTask 2で作成した手動モック`src/ga/__mocks__/wasmBridge.ts`を使う）

- [ ] **Step 4: テストを実行して確認する**

Run: `bun run test --run src/ga/core.test.ts src/hooks/useSimulator.test.ts`
Expected: 全てPASS（テスト件数・アサーション内容は変わらない）

Run: `bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: fitness参照実装をテスト間で共有する

core.test.ts の calcFitnessRef と useSimulator.test.ts のインライン
モック実装が同一ロジック（文字一致率計算）を個別実装していた。
src/testUtils/referenceFitness.ts に抽出し両ファイルから共有する。
useSimulator.test.ts はあわせて Task 2 の手動モックを使う形に統一。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: chart.js / vue-chartjs モックの手動モック化

**Files:**
- Create: `__mocks__/chart.js.ts`（リポジトリルート）
- Create: `__mocks__/vue-chartjs.ts`（リポジトリルート）
- Modify: `src/App.test.tsx`
- Modify: `src/components/ConvergenceGraph.test.tsx`

**Interfaces:**
- Produces: `chart.js`パッケージの`Chart`/`CategoryScale`/`LinearScale`/`PointElement`/`LineElement`/`Title`/`Tooltip`/`Legend`のスタブ、`vue-chartjs`パッケージの`Line`コンポーネントスタブ（`data-testid="chart-canvas"`の`<canvas>`をレンダリング）

- [ ] **Step 1: chart.js の手動モックを作成する**

`__mocks__/chart.js.ts`:
```ts
export const Chart = { register: () => {} };
export const CategoryScale = {};
export const LinearScale = {};
export const PointElement = {};
export const LineElement = {};
export const Title = {};
export const Tooltip = {};
export const Legend = {};
```

- [ ] **Step 2: vue-chartjs の手動モックを作成する**

`__mocks__/vue-chartjs.ts`:
```ts
import { h } from "vue";

export const Line = {
  name: "Line",
  props: ["data", "options"],
  render: () => h("canvas", { "data-testid": "chart-canvas" }),
};
```

- [ ] **Step 3: App.test.tsx を簡略化する**

`src/App.test.tsx` の先頭を変更:

Before（1〜30行目）:
```ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("chart.js", () => ({
  Chart: { register: () => {} },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

vi.mock("vue-chartjs", async () => {
  const { h } = await import("vue");
  return {
    Line: {
      name: "Line",
      props: ["data", "options"],
      render: () => h("div", { "data-testid": "chart" }),
    },
  };
});

vi.mock("./ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn().mockReturnValue(0),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
  initWasm: vi.fn().mockResolvedValue(undefined),
}));

import App from "./App";
```

After:
```ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("chart.js");
vi.mock("vue-chartjs");

vi.mock("./ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn().mockReturnValue(0),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
  initWasm: vi.fn().mockResolvedValue(undefined),
}));

import App from "./App";
```

（`data-testid`の値が`"chart"`→`"chart-canvas"`、タグが`div`→`canvas`に変わるが、`App.test.tsx`内のどのアサーションもこのtestid値を参照していないため検証内容に影響しない。以降の行は変更しない）

- [ ] **Step 4: ConvergenceGraph.test.tsx を簡略化する**

`src/components/ConvergenceGraph.test.tsx` の先頭を変更:

Before（1〜26行目）:
```ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("chart.js", () => ({
  Chart: { register: () => {} },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

vi.mock("vue-chartjs", async () => {
  const { h } = await import("vue");
  return {
    Line: {
      name: "Line",
      props: ["data", "options"],
      render: () => h("canvas", { "data-testid": "chart-canvas" }),
    },
  };
});

import ConvergenceGraph from "./ConvergenceGraph";
```

After:
```ts
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("chart.js");
vi.mock("vue-chartjs");

import ConvergenceGraph from "./ConvergenceGraph";
```

（以降の行は変更しない。`data-testid="chart-canvas"`を参照する3つのアサーションはそのまま通る）

- [ ] **Step 5: テストを実行して確認する**

Run: `bun run test --run src/App.test.tsx src/components/ConvergenceGraph.test.tsx`
Expected: 全てPASS

Run: `bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: chart.js/vue-chartjsモックを手動モックに一本化

App.test.tsx と ConvergenceGraph.test.tsx がほぼ同一の vi.mock
ブロックを個別に持っていた（差異はvue-chartjsモックのdata-testid値
とタグのみで、App.test.tsx側はその値をアサーションで参照していない
ことを確認済み）。ルートの __mocks__/chart.js.ts・vue-chartjs.ts に
一本化し、両テストは vi.mock("chart.js") / vi.mock("vue-chartjs") に
簡略化。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: wasmBridge.ts自体のテスト追加

**Files:**
- Create: `src/ga/wasmBridge.test.ts`

**Interfaces:**
- Consumes: `src/ga/wasmBridge.ts`の`initWasm(): Promise<void>`・`wasmCalcFitness(ind: string, target: string): number`・`wasmEvolve(population: string[], target: string, selectionMethod?: SelectionMethod): string[]`、および`src/mbt.d.ts`で宣言された`mbt:ga-core/src`モジュールの`init(): Promise<{ exports: { calc_fitness; evolve; init_rng } }>`

- [ ] **Step 1: テストファイルを作成する**

`src/ga/wasmBridge.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("mbt:ga-core/src", () => mocks);

describe("wasmBridge", () => {
  it("initWasm 前に wasmCalcFitness を呼ぶとエラーを投げる", async () => {
    vi.resetModules();
    const { wasmCalcFitness } = await import("./wasmBridge");
    expect(() => wasmCalcFitness("0", "0")).toThrow("Wasm not initialized");
  });

  it("initWasm 前に wasmEvolve を呼ぶとエラーを投げる", async () => {
    vi.resetModules();
    const { wasmEvolve } = await import("./wasmBridge");
    expect(() => wasmEvolve(["0"], "0", "elite")).toThrow("Wasm not initialized");
  });

  it("initWasm 後は wasmCalcFitness が calc_fitness へ委譲する", async () => {
    vi.resetModules();
    const calc_fitness = vi.fn().mockReturnValue(0.5);
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness, evolve: vi.fn(), init_rng: vi.fn() },
    });
    const { initWasm, wasmCalcFitness } = await import("./wasmBridge");
    await initWasm();
    expect(wasmCalcFitness("1010", "1111")).toBe(0.5);
    expect(calc_fitness).toHaveBeenCalledWith("1010", "1111");
  });

  it("wasmEvolve は population を '|' で結合して evolve に渡し、結果を分割して返す", async () => {
    vi.resetModules();
    const evolve = vi.fn().mockReturnValue("00|11|10");
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness: vi.fn(), evolve, init_rng: vi.fn() },
    });
    const { initWasm, wasmEvolve } = await import("./wasmBridge");
    await initWasm();
    const result = wasmEvolve(["00", "11", "01"], "target", "elite");
    expect(evolve).toHaveBeenCalledWith("00|11|01", "target", "elite");
    expect(result).toEqual(["00", "11", "10"]);
  });

  it("initWasm は init_rng を1回呼び出す", async () => {
    vi.resetModules();
    const init_rng = vi.fn();
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness: vi.fn(), evolve: vi.fn(), init_rng },
    });
    const { initWasm } = await import("./wasmBridge");
    await initWasm();
    expect(init_rng).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: テストを実行して確認する**

Run: `bun run test --run src/ga/wasmBridge.test.ts`
Expected: 5件全てPASS

- [ ] **Step 3: 全体を確認する**

Run: `bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
test: wasmBridge.ts自体の新規テストを追加

全てのテストがこのモジュールをモックしていたため、SEP('|')による
join/split処理と未初期化時のエラー投げが一度もテストされていな
かった。src/ga/wasmBridge.test.ts で新規にカバーする。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 特性化テストのベースライン確定（リファクタ前）

**Files:**
- Create: `src/testUtils/seededRandom.ts`
- Modify: `src/ga/core.test.ts`
- Modify: `src/hooks/useSimulator.test.ts`
- Create: `src/ga/__snapshots__/core.test.ts.snap`（vitestが自動生成）
- Create: `src/hooks/__snapshots__/useSimulator.test.ts.snap`（vitestが自動生成）

**Interfaces:**
- Produces: `createSeededRandom(seed: number): () => number` — `vi.spyOn(Math, "random").mockImplementation(...)`に渡す決定的な乱数生成関数

**重要:** このタスクは Task 7・8（`core.ts`/`useSimulator.ts`のリファクタ本体）より **前** に実施し、ここで確定したスナップショットをコミットする。Task 7・8完了後に同じテストを無変更で再実行し、スナップショット差分が0件であることを確認する（Task 7・8のStepに検証コマンドを記載）。

- [ ] **Step 1: 決定的な擬似乱数生成器を作成する**

`src/testUtils/seededRandom.ts`:
```ts
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
```

- [ ] **Step 2: core.ts の特性化テストを追加する**

`src/ga/core.test.ts` の末尾（`stepState`の`describe`ブロックの後）に追加:

```ts
// ─── 特性化テスト（リファクタ前後の動作保証） ──────────────────

describe("characterization（リファクタ前後の動作保証）", () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, "random").mockImplementation(createSeededRandom(42));
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it("initState('HI') の出力全体がリファクタ前後で一致する", () => {
    expect(initState("HI")).toMatchSnapshot();
  });

  it("stepState を3世代進めた出力全体がリファクタ前後で一致する", () => {
    let state = initState("HI");
    for (let i = 0; i < 3; i++) {
      state = stepState(state);
    }
    expect(state).toMatchSnapshot();
  });
});
```

ファイル先頭のimportに`afterEach`と`createSeededRandom`を追加:

Before:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
```

After:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

さらに`import { referenceFitness } from "../testUtils/referenceFitness";`の下に追加:
```ts
import { createSeededRandom } from "../testUtils/seededRandom";
```

- [ ] **Step 3: useSimulator.ts の特性化テストを追加する**

`src/hooks/useSimulator.test.ts` の末尾（`describe("自動進化", ...)`ブロックの後）に追加:

```ts
// ─── 特性化テスト（リファクタ前後の動作保証） ──────────────────

describe("characterization（リファクタ前後の動作保証）", () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, "random").mockImplementation(createSeededRandom(7));
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it("stepOnce を3回実行した後の state 全体がリファクタ前後で一致する", async () => {
    const { result } = renderHook(() => useSimulator());
    for (let i = 0; i < 3; i++) {
      result.value[1].stepOnce();
      await nextTick();
    }
    expect(result.value[0]).toMatchSnapshot();
  });
});
```

ファイル先頭のimportに`createSeededRandom`を追加（`referenceFitness`のimportの下）:
```ts
import { createSeededRandom } from "../testUtils/seededRandom";
```

- [ ] **Step 4: テストを実行してスナップショットを新規生成する**

Run: `bun run test --run src/ga/core.test.ts src/hooks/useSimulator.test.ts`
Expected: 全てPASS。`src/ga/__snapshots__/core.test.ts.snap`と`src/hooks/__snapshots__/useSimulator.test.ts.snap`が新規生成される（vitestは初回実行時にスナップショットが無ければ自動生成してPASSする）

- [ ] **Step 5: 生成されたスナップショットの中身を目視確認する**

Run: `cat src/ga/__snapshots__/core.test.ts.snap src/hooks/__snapshots__/useSimulator.test.ts.snap`
Expected: `best`/`avg`/`diversity`が`[0, 1]`の範囲内の妥当な数値で、`population`が`'0'`/`'1'`のみで構成された文字列配列であることを目視で確認する（明らかにおかしい値がないことの確認）

- [ ] **Step 6: 全体を確認してコミット（これがベースライン）**

Run: `bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

```bash
git add -A
git commit -m "$(cat <<'EOF'
test: リファクタ前の完全な出力をスナップショットとして確定

initState/stepState/useSimulatorのtick処理を次のタスクでリファクタ
する前に、乱数を固定した特性化テストで現在の出力全体をvitestスナ
ップショットとして記録する。次のリファクタ後にこのテストを無変更
で再実行し、差分0件であることを確認する（このコミットがベース
ライン）。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: core.ts のリファクタ（summarize抽出・PERCENT一本化）

**Files:**
- Modify: `src/ga/core.ts`
- Modify: `src/components/StatusBar.tsx`
- Modify: `src/components/IndividualList.tsx`
- Modify: `src/components/ConvergenceGraph.tsx`

**Interfaces:**
- Consumes: Task 6で確定した`src/ga/__snapshots__/core.test.ts.snap`（このタスクでは変更しない）
- Produces: `core.ts`が新たに`export const PERCENT = 100;`をexportする。`initState`/`stepState`の公開シグネチャ・戻り値の型は変えない

**このタスクの完了条件は「Task 6のスナップショットが無変更で一致すること」。1件でも差分が出た場合はこのタスクの実装ミスなので、スナップショットを更新せず実装を直す。**

- [ ] **Step 1: core.ts に summarize() ヘルパーと PERCENT 定数を追加し、initState/stepState を書き換える**

`src/ga/core.ts` 全体を以下に置き換える:

```ts
import type { HistoryEntry, Individual, SelectionMethod, SimState } from "../types";
import { wasmCalcFitness, wasmEvolve } from "./wasmBridge";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // A=00000(0), Z=11001(25), space=11010(26)
export const BITS_PER_CHAR = 5;
export const MAX_TARGET_LEN = 20;
export const POP_SIZE = 30;
export const MUTATION_RATE = 0.03;
export const ELITE_RATIO = 0.4;
export const DEFAULT_SPEED = 300;
export const PERCENT = 100;

export const calcFitness = wasmCalcFitness;

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

export function charToBin(char: string): string {
  const index = CHARS.indexOf(char);
  const safeIndex = index === -1 ? 0 : index;
  // eslint-disable-next-line no-magic-numbers
  return safeIndex.toString(2).padStart(BITS_PER_CHAR, "0");
}

export function binToChar(bin: string): string {
  const index = parseInt(bin, 2);
  // 0-26 are mapped, 27-31 are space as requested
  return CHARS[index] || " ";
}

export function encode(text: string): string {
  return [...text].map(charToBin).join("");
}

export function decode(bin: string): string {
  return Array.from({ length: bin.length / BITS_PER_CHAR }, (_, i) =>
    binToChar(bin.slice(i * BITS_PER_CHAR, i * BITS_PER_CHAR + BITS_PER_CHAR)),
  ).join("");
}

export function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .slice(0, MAX_TARGET_LEN);
}

function randomBit(): string {
  // eslint-disable-next-line no-magic-numbers
  return Math.random() < 0.5 ? "0" : "1";
}

function randomIndividual(targetLen: number): Individual {
  // Each character is BITS_PER_CHAR bits
  return Array.from({ length: targetLen * BITS_PER_CHAR }, randomBit).join("");
}

interface Summary {
  best: number;
  avg: number;
  historyEntry: HistoryEntry;
}

// 集団のfitsを計算し、best/avg/historyエントリーをまとめて返す
// (initState/stepState で重複していた計算を共通化)
function summarize(population: Individual[], binTarget: string, generation: number): Summary {
  const fits = population.map((ind) => wasmCalcFitness(ind, binTarget));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  return {
    best,
    avg,
    historyEntry: { generation, best, avg, diversity: calcDiversity(population) },
  };
}

// eslint-disable-next-line no-magic-numbers
export function initState(
  target: string,
  prevSpeed = DEFAULT_SPEED,
  prevSelectionMethod: SelectionMethod = "elite",
): SimState {
  const binTarget = encode(target);
  const population = Array.from({ length: POP_SIZE }, () => randomIndividual(target.length));
  const { historyEntry } = summarize(population, binTarget, 0);
  return {
    target,
    population,
    generation: 0,
    history: [historyEntry],
    isRunning: false,
    speed: prevSpeed,
    solved: false,
    selectionMethod: prevSelectionMethod,
  };
}

export function stepState(prev: SimState): SimState {
  if (prev.solved) {
    return { ...prev, isRunning: false };
  }
  const binTarget = encode(prev.target);
  const newPop = wasmEvolve(prev.population, binTarget, prev.selectionMethod);
  const generation = prev.generation + 1;
  const { best, historyEntry } = summarize(newPop, binTarget, generation);
  const solved = best >= 1;
  return {
    ...prev,
    population: newPop,
    generation,
    history: [...prev.history, historyEntry],
    isRunning: solved ? false : prev.isRunning,
    solved,
  };
}
```

- [ ] **Step 2: StatusBar.tsx のローカル PERCENT 宣言を core.ts からのimportに置き換える**

`src/components/StatusBar.tsx` の先頭を変更:

Before:
```tsx
import { defineComponent } from "vue";

import GeneDisplay from "./GeneDisplay";

const PERCENT = 100;
```

After:
```tsx
import { defineComponent } from "vue";

import { PERCENT } from "../ga/core";
import GeneDisplay from "./GeneDisplay";
```

- [ ] **Step 3: IndividualList.tsx のローカル PERCENT 宣言を core.ts からのimportに置き換える**

`src/components/IndividualList.tsx` の先頭を変更:

Before:
```tsx
import { defineComponent, type PropType } from "vue";

import type { Individual } from "../types";
import GeneDisplay from "./GeneDisplay";

const ELITE_DISPLAY_COUNT = 3;
const FIT_HIGH = 0.8;
const FIT_MID = 0.5;
const PERCENT = 100;
```

After:
```tsx
import { defineComponent, type PropType } from "vue";

import { PERCENT } from "../ga/core";
import type { Individual } from "../types";
import GeneDisplay from "./GeneDisplay";

const ELITE_DISPLAY_COUNT = 3;
const FIT_HIGH = 0.8;
const FIT_MID = 0.5;
```

- [ ] **Step 4: ConvergenceGraph.tsx のローカル PERCENT 宣言を core.ts からのimportに置き換える**

`src/components/ConvergenceGraph.tsx` の先頭を変更:

Before:
```tsx
import type { HistoryEntry } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MAX_DISPLAY = 150;
const PERCENT = 100;
const DASH_PATTERN = [5, 5]; // eslint-disable-line no-magic-numbers
```

After:
```tsx
import { PERCENT } from "../ga/core";
import type { HistoryEntry } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MAX_DISPLAY = 150;
const DASH_PATTERN = [5, 5]; // eslint-disable-line no-magic-numbers
```

- [ ] **Step 5: Task 6 の特性化テストのスナップショットが無変更で一致することを確認する**

Run: `bun run test --run src/ga/core.test.ts src/hooks/useSimulator.test.ts`
Expected: 全てPASS。`git diff src/ga/__snapshots__/core.test.ts.snap`が空であること（`git status`でスナップショットファイルが変更扱いになっていないこと）

Run: `git status --short src/ga/__snapshots__/ src/hooks/__snapshots__/`
Expected: 出力なし（差分ゼロ）

- [ ] **Step 6: 全体を確認する**

Run: `bun run build && bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: core.tsのinitState/stepStateの重複をsummarize()に集約

initState/stepStateが「fits計算→best/avg算出→historyエントリー
生成」をほぼ同一コードで重複していた。共通のsummarize()ヘルパー
に抽出。あわせてStatusBar/IndividualList/ConvergenceGraphで個別
宣言されていたPERCENT=100定数をcore.tsに一本化。

Task 6で確定した特性化テストのスナップショットが無変更で一致する
ことを確認済み（リファクタ前後で出力が完全に同一）。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: useSimulator.ts のリファクタ（tick処理の共通化）

**Files:**
- Modify: `src/hooks/useSimulator.ts`

**Interfaces:**
- Consumes: Task 6で確定した`src/hooks/__snapshots__/useSimulator.test.ts.snap`（このタスクでは変更しない）
- Produces: `useSimulator(): [SimState, SimulatorActions]`の公開シグネチャは変えない

**このタスクの完了条件は「Task 6のスナップショットが無変更で一致すること」。1件でも差分が出た場合はこのタスクの実装ミスなので、スナップショットを更新せず実装を直す。**

- [ ] **Step 1: tick処理を共通ヘルパーに抽出する**

`src/hooks/useSimulator.ts` 全体を以下に置き換える:

```ts
import { reactive, watch, onUnmounted } from "vue";

import { initState, stepState, sanitize } from "../ga/core";
import type { SelectionMethod, SimState } from "../types";

const DEFAULT_TARGET = "HELLO WORLD";

export interface SimulatorActions {
  start: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  applyTarget: (rawInput: string) => void;
  setSelectionMethod: (selectionMethod: SelectionMethod) => void;
}

// 1世代分進めて state に反映する（インターバルtickと stepOnce の共通処理）
function applyStep(state: SimState): void {
  Object.assign(state, stepState({ ...state } as SimState));
}

export function useSimulator(): [SimState, SimulatorActions] {
  const state = reactive<SimState>(initState(DEFAULT_TARGET));
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const clearTimer = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  // flush: "sync" で依存変化と同期的に実行（React の useEffect に相当）
  watch(
    () => [state.isRunning, state.speed] as const,
    ([isRunning, speed]) => {
      clearTimer();
      if (isRunning) {
        intervalId = setInterval(() => applyStep(state), speed);
      }
    },
    { flush: "sync" },
  );

  onUnmounted(() => clearTimer());

  const start = () => {
    state.isRunning = true;
  };
  const pause = () => {
    state.isRunning = false;
  };
  const stepOnce = () => applyStep(state);
  const reset = () => {
    Object.assign(state, initState(state.target, state.speed, state.selectionMethod));
  };
  const setSpeed = (speed: number) => {
    state.speed = speed;
  };
  const applyTarget = (rawInput: string) => {
    const cleaned = sanitize(rawInput);
    if (!cleaned.trim()) {
      return;
    }
    Object.assign(state, initState(cleaned, state.speed, state.selectionMethod));
  };
  const setSelectionMethod = (selectionMethod: SelectionMethod) => {
    state.selectionMethod = selectionMethod;
  };

  return [
    state as unknown as SimState,
    { start, pause, stepOnce, reset, setSpeed, applyTarget, setSelectionMethod },
  ];
}
```

（`applyStep`関数内の`{ ...state } as SimState`、戻り値の`state as unknown as SimState`は、Vueの`reactive()`が返す`UnwrapNestedRefs<SimState>`型に起因するキャストのため維持する。Step 2でこれらを削減できないか試す）

- [ ] **Step 2: 型キャストを削減できないか試す**

`applyStep`内の`{ ...state } as SimState`を`{ ...state }`（キャストなし）に変更し、`bun run build`（`tsc -b`を含む）を実行する。

```ts
function applyStep(state: SimState): void {
  Object.assign(state, stepState({ ...state }));
}
```

Run: `bun run build`

- 型エラーなくPASSした場合 → この変更を採用する
- 型エラーが出た場合 → Step 1の`{ ...state } as SimState`に戻す

同様に、戻り値の`state as unknown as SimState`を`state as SimState`（`unknown`を経由しない単一キャスト）に変更し、`bun run build`を実行する。

```ts
return [
  state as SimState,
  { start, pause, stepOnce, reset, setSpeed, applyTarget, setSelectionMethod },
];
```

Run: `bun run build`

- 型エラーなくPASSした場合 → この変更を採用する
- 型エラーが出た場合（`UnwrapNestedRefs<SimState>`が`SimState`に直接代入不可能というエラーが想定される）→ Step 1の`state as unknown as SimState`に戻す

- [ ] **Step 3: Task 6 の特性化テストのスナップショットが無変更で一致することを確認する**

Run: `bun run test --run src/hooks/useSimulator.test.ts`
Expected: 全てPASS

Run: `git status --short src/hooks/__snapshots__/`
Expected: 出力なし（差分ゼロ）

- [ ] **Step 4: 全体を確認する**

Run: `bun run build && bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: useSimulatorのtick処理をapplyStep()に集約

インターバルのtickとstepOnce()アクションが Object.assign(state,
stepState({ ...state } as SimState)) を重複して持っていた。共通の
applyStep()ヘルパーに抽出。型キャストの削減可否も確認した(詳細は
実装コメント参照)。

Task 6で確定した特性化テストのスナップショットが無変更で一致する
ことを確認済み（リファクタ前後で出力が完全に同一）。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: MoonBit側のスタイル統一

**Files:**
- Modify: `moonbit/src/selection_roulette.mbt`

**Interfaces:** なし（内部ループの構文差のみ、公開関数`roulette_select`のシグネチャ・挙動は変えない）

- [ ] **Step 1: whileループのインクリメント構文を統一する**

`moonbit/src/selection_roulette.mbt` の該当部分を変更:

Before:
```
  let point = rand_double() * total
  let mut selected = pop[n - 1]
  let mut i = 0
  while i < n {
    if cumulative[i] > point {
      selected = pop[i]
      break
    }
    i = i + 1
  }
  selected
```

After:
```
  let point = rand_double() * total
  let mut selected = pop[n - 1]
  let mut i = 0
  while i < n {
    if cumulative[i] > point {
      selected = pop[i]
      break
    }
    i += 1
  }
  selected
```

- [ ] **Step 2: MoonBitのテストとビルドを実行する**

Run: `mise run moon:test`
Expected: 30テスト全てPASS（既存のwhitebox testで`roulette_select`の挙動は既にカバーされている）

Run: `mise run moon:build`
Expected: PASS

- [ ] **Step 3: 全体を確認する**

Run: `bun run build && bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "$(cat <<'EOF'
style: selection_roulette.mbtのインクリメント構文を統一

i = i + 1 を、他ファイル（individual.mbtのm += 1）に合わせて
i += 1 に統一。意味的な変更はなし。

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: 最終確認

**Files:** なし（検証のみ）

**Interfaces:** なし

- [ ] **Step 1: TS/Vue側のフルスイートを実行する**

Run: `bun run build && bun run test --run && bun run lint && bun run fmt:check`
Expected: 全てPASS。テスト件数が元の123件 + Task 5で追加した5件 + Task 6で追加した3件 = 131件以上になっていることを確認する

- [ ] **Step 2: MoonBit側のフルスイートを実行する**

Run: `mise run moon:test && mise run moon:build`
Expected: 全てPASS

- [ ] **Step 3: カバレッジレポートを確認する**

Run: `bun run test:coverage`
Expected: PASS。`src/testUtils/**`・`src/ga/__mocks__/**`がカバレッジ集計から除外されていることをレポート出力で確認する

- [ ] **Step 4: 削除・新規ファイルの一覧を最終確認する**

Run: `git log --oneline chore/mise-setup..HEAD` （このリファクタで積んだコミット一覧を確認）
Run: `git diff --stat 8250ae9..HEAD` （Task 1開始時点との差分ファイル一覧を確認）

Expected: 設計ドキュメント（`docs/superpowers/specs/2026-08-13-repo-wide-refactor-design.md`）に記載したA〜Dの変更が過不足なく反映されていること
