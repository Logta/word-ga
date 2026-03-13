# CLAUDE.md

## プロジェクト概要

遺伝的アルゴリズム（GA）で文字列を進化させる React + MoonBit (Wasm) シミュレーター。
GAのコア処理を MoonBit で実装し wasm-gc にコンパイル、React フロントエンドから呼び出す。

---

## アーキテクチャ

```
[ React UI ]
     │
     ▼
[ useSimulator.ts ]        ← シミュレーション状態管理 Hook
     │
     ▼
[ src/ga/core.ts ]         ← initState / stepState（JS層）
     │
     ▼
[ src/ga/wasmBridge.ts ]   ← Wasm ロード・関数ブリッジ
     │
     ▼
[ MoonBit → wasm-gc ]      ← GAコアロジック（calc_fitness / evolve / init_rng）
```

### レイヤー責務

| レイヤー | ファイル | 責務 |
|---|---|---|
| UI | `src/components/` | 表示のみ。Controls / IndividualList / ConvergenceGraph など |
| Hook | `src/hooks/useSimulator.ts` | シミュレーション状態・ステップ実行・wasmReady管理 |
| JS GA | `src/ga/core.ts` | 世代管理、集団の初期化・更新（`initState` / `stepState`） |
| Wasm Bridge | `src/ga/wasmBridge.ts` | Wasm インスタンス取得、エクスポート関数のラップ |
| MoonBit | `moonbit/src/` | `rng.mbt`（乱数）/ `individual.mbt`（適応度）/ `ga.mbt`（進化） |

### Wasm ↔ JS 通信

- 集団は `|` セパレータで join した文字列として渡す（ADR-008）
- `evolve(population: String, target: String, seed: Int): String` を呼び出し、結果を `split("|")` で戻す
- 乱数シードは JS 側の `Date.now()` で生成し `init_rng(seed)` で初期化（ADR-004）

---

## ファイル構成

```
word-ga/
├── CLAUDE.md
├── README.md
├── adrs/                      # Architecture Decision Records
├── moonbit/                   # MoonBit プロジェクト
│   ├── moon.mod.json          # name: ga-core
│   └── src/
│       ├── moon.pkg.json      # exports: calc_fitness, evolve, init_rng
│       ├── rng.mbt            # xorshift64 乱数生成
│       ├── individual.mbt     # 個体・適応度計算
│       ├── ga.mbt             # crossover / mutate / evolve
│       └── *_wbtest.mbt      # ホワイトボックステスト
└── src/
    ├── ga/
    │   ├── wasmBridge.ts      # Wasm ロード・ブリッジ
    │   └── core.ts            # initState / stepState
    ├── hooks/useSimulator.ts  # シミュレーション状態 Hook
    ├── components/            # UI コンポーネント群
    ├── types/                 # 型定義
    └── mbt.d.ts               # mbt:* モジュール型宣言
```

---

## 開発コマンド

```bash
bun install          # 依存インストール
bun run dev          # 開発サーバー
bun run build        # プロダクションビルド（MoonBit → wasm-gc → Vite）
bun run test         # TypeScript テスト（vitest）

# MoonBit
cd moonbit && moon build --target wasm-gc --release
cd moonbit && moon test --target wasm-gc
cd moonbit && moon test --enable-coverage && moon coverage report -f summary
```

---

## ADR 一覧

タスク開始前に必ず全 ADR を参照し、決定済みの技術選択・制約を把握すること。

| ファイル | 内容 |
|---|---|
| `adrs/001-moonbit-wasm-gc.md` | MoonBit + wasm-gc をコアロジックに採用 |
| `adrs/002-5bit-binary-encoding.md` | 遺伝子型を5ビットバイナリエンコーディングで表現 |
| `adrs/003-bit-level-fitness.md` | 適応度計算をビット単位で行う |
| `adrs/004-xorshift64-rng.md` | xorshift64 + JS側シードで乱数生成 |
| `adrs/005-tailwind-v4.md` | スタイリングに Tailwind CSS v4 を採用 |
| `adrs/006-recharts.md` | グラフ描画に recharts を採用 |
| `adrs/007-elite-selection.md` | エリート選択戦略（elite_ratio=0.4）を採用 |
| `adrs/008-pipe-separator-wasm-api.md` | `\|` セパレータで集団をjoinしてWasm間通信 |
| `adrs/009-bun-migration.md` | JS ベースを npm から Bun に移行 |
| `adrs/010-pcg-rng.md` | 乱数生成を xorshift64 から PCG に変更 |

---

## 変更ルール

### ADR を作成するタイミング（実装前に作成）

以下に該当する変更は実装前に `adrs/NNN-<kebab-case>.md` を作成し、Status を `Proposed` にする。
実施後は `Accepted` に更新し、下記インデックス表に追記すること。

- ライブラリ・フレームワーク・ランタイム・ビルドツールの導入・置き換え
- データ構造・エンコーディング方式の変更
- アルゴリズム・GA パラメータの変更
- Wasm ↔ JS 間の API 設計変更
- MoonBit ビルドターゲット・設定変更

**ADR フォーマット:** `## Context` / `## Decision` / `## Consequences`（不採用案も記載）

### README.md を更新するタイミング

以下の変更後は必ず `README.md` を最新状態に更新すること。

- 技術スタック・ランタイム・コマンドの変更
- セットアップ・ビルド・テスト手順の変更
- 仕様変更（エンコーディング・アルゴリズム）
- 新機能追加・既存機能削除
