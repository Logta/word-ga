# ADR-005: スタイリングに Tailwind CSS v4 を採用

**Status**: Accepted

## Context

React アプリのスタイリングには CSS-in-JS、CSS Modules、ユーティリティファーストCSSフレームワークなど複数の選択肢がある。開発スピードと一貫性を重視し、ユーティリティファーストの Tailwind CSS を採用することにした。Tailwind CSS v4 は v3 から設定方式が大きく変わっており、`tailwind.config.js` ではなく CSS ファイルによる設定方式に移行している。

## Decision

Tailwind CSS v4 を採用し、以下の設定で統合した:

- PostCSS プラグインとして `@tailwindcss/postcss` を使用（`postcss.config.js`）
- `src/index.css` で `@import "tailwindcss"` を使用（v3 の `@tailwind` ディレクティブは廃止）
- `tailwind.config.js` は不要（v4 は CSS ファイルベースの設定方式）

## Consequences

### メリット
- ユーティリティクラスによる高速なスタイリングとプロトタイピングが可能
- v4 は v3 に比べてビルドが高速（Rust ベースのコアエンジン）
- CSS 変数ベースのテーマシステムにより、カスタムデザイントークンの管理が容易
- `tailwind.config.js` が不要になりプロジェクト設定がシンプル

### トレードオフ
- v4 は v3 からの移行で破壊的変更が多く、`@tailwind` ディレクティブや `postcss` 設定の書き方が変わっている
- `@tailwindcss/postcss` パッケージが別途必要
- v4 のドキュメントや Community プラグインはまだ v3 ほど充実していない場合がある
