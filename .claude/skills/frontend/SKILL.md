---
name: frontend
description: Vue 3 TSX、Vite、Tailwind v4、vitest、wasmBridgeモック、oxlint/oxfmt固有の注意事項を含むフロントエンド実装・テスト作業
---

# フロントエンド実装時の考慮事項

## vite-plugin-moonbit

- `vite.config.ts` の `moonbit()` には `root: "moonbit"` と `useJsBuiltinString: true` が必要
- Wasm モジュールは `mbt:ga-core/src` という仮想モジュール ID で解決される
- 型宣言は `src/mbt.d.ts` に `declare module "mbt:ga-core/src"` として記述する
- `init()` は `Promise<{ exports: { ... } }>` を返す

## テストでの wasmBridge モック

`core.ts` → `wasmBridge.ts` → `mbt:ga-core/src`（Wasm）の依存チェーンがある。CI 環境では Wasm ファイルが存在しない場合に Vite の `vite:import-analysis` が動的 import を解決できずテストが落ちる。

`core.ts` を（直接・間接に）インポートするテストファイルは必ず `wasmBridge` をモックする:

```ts
// src/components/*.test.tsx など core.ts を使うテスト
vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));

// src/App.test.tsx など
vi.mock("./ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn().mockReturnValue(0),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
  initWasm: vi.fn().mockResolvedValue(undefined),
}));
```

## chart.js のモック

`vi.mock("chart.js", ...)` ではクラスではなくプレーンオブジェクトを使う（空クラスは `no-empty-class` lint エラーになる）:

```ts
vi.mock("chart.js", () => ({
  Chart: { register: () => {} },  // class {} ではなく object
  CategoryScale: {},
  LinearScale: {},
  // ...
}));
```

`vue-chartjs` のモックは async factory で `h` を import する:

```ts
vi.mock("vue-chartjs", async () => {
  const { h } = await import("vue");
  return {
    Line: { name: "Line", props: ["data", "options"], render: () => h("canvas") },
  };
});
```

## Tailwind CSS v4

- `src/index.css`: `@import "tailwindcss"`（`@tailwind` ディレクティブは廃止）
- `postcss.config.js`: `"@tailwindcss/postcss": {}`（`tailwindcss:` は使えない）
- `tailwind.config.js` は不要（v4 は CSS 設定方式）

## Vite 8 (rolldown)

- `manualChunks` はオブジェクト形式ではなく関数形式:

```ts
manualChunks: (id) => {
  if (id.includes("node_modules/recharts")) return "recharts";
}
```

## oxlint

- テストファイル（`**/*.test.ts`, `**/*.test.tsx`）は `oxlint.json` の `overrides` で `no-magic-numbers` を `"off"` にする
- `unicorn/number-literal-case` は oxfmt と競合する（oxfmt が hex を小文字に正規化するため）→ `"off"` にする
- 浮動小数点リテラルの末尾ゼロは `no-zero-fractions` で弾かれる → `1.0` ではなく `1` と書く

## oxfmt

- `sortImports` が有効なためインポート順は自動整列される → 手動で並べる必要なし
- `objectWrap: "collapse"` により短いオブジェクトリテラルは1行に折り畳まれる

## Vue 3 JSX コンポーネントのテスト

- `@vue/test-utils` の `mount()` でマウントする
- `wrapper.find("span").text()` は空白を正規化する → NBSP（`\u00A0`）の検証には `element.textContent` を使う
- `wrapper.find("input").element.value` は型が `Element` → `HTMLInputElement` にキャストが必要:

```ts
(wrapper.find("input[type=range]").element as HTMLInputElement).value
```

- `wrapper.find("select").element.value` も同様に `HTMLSelectElement` へキャスト
