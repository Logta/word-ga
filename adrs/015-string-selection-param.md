# ADR-015: 選択戦略パラメータをIntからStringに変更

**Status**: Accepted

## Context

ADR-014 でプラガブル選択戦略を導入した際、`evolve(population, target, sel: Int)` の第3引数に `0`（エリート）/ `1`（ルーレット）のマジックナンバーを使用した。この設計には以下の問題がある。

- JS 側（`wasmBridge.ts`）で `selectionMethod === "roulette" ? 1 : 0` という変換が必要で、型情報が失われる
- MoonBit 側で `if sel == 1 { ... } else { ... }` という分岐になり、enum による網羅的マッチができない
- 新しい選択戦略を追加する際、JS 側の変換ロジックも修正が必要

`useJsBuiltinString: true` の設定により、JS 文字列は MoonBit の `String` として直接渡せるため、文字列を使っても追加コストはない。

## Decision

`evolve` の第3引数を `sel: Int` から `sel: String` に変更し、`"elite"` / `"roulette"` のような文字列を直接受け取る。

- MoonBit 側: `match sel { "roulette" => roulette_select, _ => elite_select }` で dispatch
- JS 側: 変換ロジックを削除し、`selectionMethod` をそのまま Wasm に渡す
- 型宣言（`mbt.d.ts`）: `sel: number` → `sel: string`

## Consequences

### メリット
- JS 側の `selectionMethod === "roulette" ? 1 : 0` 変換が不要になる
- MoonBit 側で `match` 式を使え、将来の戦略追加時に漏れを検出しやすい
- Wasm API が自己文書化される（`evolve(..., "roulette")` vs `evolve(..., 1)`）
- 新しい選択戦略追加時、JS 側の変換ロジック変更が不要

### トレードオフ
- Wasm 境界での型安全性は変わらない（どちらも実行時チェック）
- 未知の文字列値はエリート選択にフォールバックする（`_` ブランチ）
