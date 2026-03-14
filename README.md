# word-ga

遺伝的アルゴリズム（GA）を使って、ランダムなビット列からターゲット文字列へ進化させるシミュレーター。

## 概要

- 集団（30個体）がランダムなビット列から始まり、世代を重ねるごとにターゲット文字列に近づいていく様子をリアルタイムで可視化します
- **エリート選択** と **ルーレット選択** をUIで切り替えて収束挙動の違いを比較できます
- 収束グラフには最高適応度・平均適応度に加えて **集団多様性** を表示します
- 遺伝的アルゴリズムのコア処理は [MoonBit](https://www.moonbitlang.com/) で実装し、WebAssembly（wasm-gc）にコンパイルして使用します

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Vue 3 (TSX), TypeScript 5.9, Vite 8 |
| スタイリング | Tailwind CSS v4 |
| グラフ | chart.js v4 / vue-chartjs v5 |
| GAコア | MoonBit → wasm-gc (`vite-plugin-moonbit`) |
| テスト | vitest v4, @vue/test-utils |
| Lint / Format | oxlint, oxfmt |

## GAの仕組み

### 文字エンコーディング

個体のゲノムは **5ビットバイナリ文字列** で表現されます。

| 文字 | インデックス | バイナリ |
|---|---|---|
| A | 0 | `00000` |
| B | 1 | `00001` |
| ... | ... | ... |
| Z | 25 | `11001` |
| スペース | 26 | `11010` |

5ビットで表現できる値は 0〜31（32通り）ですが、使用するのは 0〜26 の 27 文字のみです。

### 適応度

デコード後の文字ではなく **生のビット列をビット単位で比較** します。

```
ターゲット: "11010"（スペース）

個体     デコード   一致ビット数  適応度
------   ------   ---------  ------
11010    スペース  5 / 5      100%  ← 満点
11110    スペース  4 / 5       80%
11111    スペース  3 / 5       60%
```

### 選択戦略

| 戦略 | 特徴 |
|---|---|
| エリート選択 | 上位40%からランダムに選択。収束が速いが多様性が低下しやすい |
| ルーレット選択 | 適応度比例確率で選択（最小適応度シフトあり）。多様性が高く初期探索に有効 |

### 集団多様性

平均ペアワイズハミング距離を染色体長で正規化した指標（理論最大値 ≈ 0.5）を毎世代記録し、収束グラフに表示します。

### wasm設計方針

MoonBit/wasmは `evolve` などの **純粋関数** のみをエクスポートし、集団・世代数・履歴などの状態はすべて TypeScript 側で管理します（ADR-016）。

## 開発

### 前提条件

- [MoonBit](https://www.moonbitlang.com/) (`moon` コマンド)
- [Bun](https://bun.sh/)

### セットアップ

```bash
bun install
```

### 開発サーバー起動

```bash
bun run dev
```

### ビルド

```bash
bun run build
```

MoonBit のコンパイル（`moonbit/` 以下）と TypeScript のビルドが順に実行されます。

### テスト

```bash
# TypeScript テスト（vitest）
bun run test

# MoonBit テスト
cd moonbit && moon test --target wasm-gc

# MoonBit カバレッジ
cd moonbit && moon coverage clean && moon test --enable-coverage && moon coverage report -f summary
```

### Lint / Format

```bash
bun run lint       # oxlint
bun run fmt        # oxfmt（上書きフォーマット）
bun run fmt:check  # oxfmt（チェックのみ）

cd moonbit && moon fmt         # MoonBit フォーマット
cd moonbit && moon fmt --check # MoonBit フォーマットチェック
```

## ADR

設計上の意思決定は `adrs/` に記録しています。
