# CLAUDE.md

## コマンド

```bash
bun run dev          # 開発サーバー
bun run build        # ビルド（MoonBit → wasm-gc → Vite）
bun run test         # TypeScript テスト（vitest）
bun run lint         # oxlint
bun run fmt          # oxfmt フォーマット

# MoonBit
cd moonbit && moon build --target wasm-gc --release
cd moonbit && moon test --target wasm-gc
cd moonbit && moon coverage clean && moon test --enable-coverage && moon coverage report -f summary
```

## ワークフロー

- 変更後は `bun run test` と `bun run lint` を実行して確認する
- MoonBit 変更後は `moon build --target wasm-gc --release` でコンパイルを確認する

## ADR ルール

**以下の変更は実装前に `adrs/NNN-<kebab-case>.md` を作成する**（Status: Proposed → 実施後 Accepted）:
- ライブラリ・フレームワーク・ランタイム・ビルドツールの変更
- データ構造・エンコーディング・アルゴリズムの変更
- Wasm ↔ JS API 設計の変更

スタックが変わったら `CLAUDE.md` と `README.md` も更新する。ADR を追加したら下記インデックスも更新する。

## ADR インデックス（詳細は `adrs/` 参照）

001 MoonBit+wasm-gc / 002 5bit符号化 / 003 ビット適応度 / 004 xorshift64乱数 /
005 Tailwind v4 / 006 recharts / 007 エリート選択 / 008 パイプ区切りWasm通信 /
009 Bun移行 / 010 PCG乱数 / 011 GitHub Pages / 012 CIワークフロー /
013 Vue+TSX移行 / 014 差し替え可能な選択戦略 / 015 選択戦略パラメータ文字列化

## コンパクション時に保持すること

変更済みファイル一覧・未解決の問題・参照した ADR 番号
