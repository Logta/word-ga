# ADR-013: フロントエンドを React から Vue 3 + TSX に移行

**Status**: Accepted

## Context

現在のフロントエンドは React 19 + TSX で実装されている。
グラフ描画には recharts（React 専用）を使用しており、フレームワーク変更時の代替が必要。

以下のフレームワークを検討した。

| 候補 | React からの移行コスト | recharts 代替 | TSX 対応 |
|---|---|---|---|
| Svelte 5 | 高（記法が大きく変わる） | 要調査（LayerCake 等）| 部分的 |
| **Vue 3 + TSX** | **低**（Composables が hooks に構造対応）| **vue-chartjs（充実）** | **完全** |

**Vue 3 を採用した理由:**
- `useSimulator.ts`（React hooks）が Vue Composables に 1:1 で対応できる（`useState` → `reactive`, `useEffect` → `watch`, `useCallback` → 関数）
- TSX モードで既存の型定義・ロジック（`core.ts`, `wasmBridge.ts`, `types/`）が変更不要
- `vue-chartjs`（Chart.js ラッパー）が充実しており recharts の代替コストが低い
- Vite 8 + `@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx` の公式サポート

## Decision

フロントエンドを React 19 から Vue 3 + TSX に移行する。

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `package.json` | react/recharts 削除 → vue/vue-chartjs/chart.js 追加 |
| `vite.config.ts` | `@vitejs/plugin-react` → `@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx` |
| `tsconfig.json` | `"jsx": "react-jsx"` → `"jsx": "preserve"` |
| `src/main.tsx` | `createRoot` → `createApp` |
| `src/App.tsx` | React FC → `defineComponent` |
| `src/components/*.tsx` | React FC → `defineComponent` |
| `src/hooks/useSimulator.ts` | React hooks → Vue Composable |
| `src/hooks/useSimulator.test.ts` | `@testing-library/react` → `@testing-library/vue` |
| `oxlint.json` | react プラグイン削除 |

### 変更なし

- `src/ga/wasmBridge.ts` — フレームワーク非依存
- `src/ga/core.ts` — フレームワーク非依存
- `src/types/index.ts` — 変更なし
- `src/ga/core.test.ts` — 変更なし
- MoonBit コード — 変更なし

### React → Vue の主要な対応関係

| React | Vue 3 |
|---|---|
| `useState` | `reactive` |
| `useEffect` | `watch({ flush: 'sync' })` |
| `useMemo` / `useCallback` | `computed` / 関数 |
| `className` | `class` |
| `onChange` (input) | `onInput` |
| `onKeyDown` | `onKeydown` |
| `recharts` | `vue-chartjs` + `chart.js` |
| `@testing-library/react` | `@testing-library/vue` |

## Consequences

### メリット
- Vue Composables により状態管理がシンプルになる
- `wasmBridge.ts` / `core.ts` の再利用でロジック層は無変更
- `vue-chartjs` は Chart.js を薄くラップしており高い柔軟性

### トレードオフ
- recharts から vue-chartjs + Chart.js への移行でグラフ設定が命令的（オブジェクト形式）になる
- `className` → `class` などの JSX 記法の差異に注意が必要
- `@testing-library/react` の `act()` → `await nextTick()` に変わる
