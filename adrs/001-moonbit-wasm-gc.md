# ADR-001: MoonBit + wasm-gc をコアロジックに採用

**Status**: Accepted

## Context

遺伝的アルゴリズムのコアロジック（適応度計算・進化ループ）は計算負荷が高く、ブラウザ上での高速実行が求められる。TypeScript のみで実装する場合、大きな集団サイズや長い文字列では UI スレッドのブロッキングが問題になる可能性がある。また、型安全性が高く静的型付けされた言語でコアアルゴリズムを記述し、React 側から呼び出せる形にしたかった。

## Decision

コアロジックを MoonBit で実装し、`wasm-gc` ターゲットでコンパイルして WebAssembly モジュールとして React アプリから呼び出す構成を採用した。ビルドには `vite-plugin-moonbit` を使用し、`mbt:ga-core/src` のような仮想モジュールパスで Vite のバンドルパイプラインに統合した。

## Consequences

### メリット
- MoonBit の静的型システムにより、GAアルゴリズムの実装を型安全に記述できる
- Wasm 実行により、TypeScript より高速なビット演算・ループが期待できる
- `vite-plugin-moonbit` によりビルドが自動化され、ホットリロードも機能する
- React 側は `wasmBridge.ts` 経由でシンプルな関数呼び出しとして利用できる

### トレードオフ
- MoonBit のエコシステムはまだ成熟しておらず、言語仕様が変わることがある（例: `String[i]` が `UInt16` を返す挙動）
- `wasm-gc` ターゲット固有の制約がある（モジュールレベル `let mut` が使えないなど）
- Wasm モジュールの初期化が非同期になるため、React 側で `wasmReady` 状態管理が必要
- デバッグは TypeScript に比べて難易度が高い
