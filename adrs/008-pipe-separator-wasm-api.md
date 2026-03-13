# ADR-008: `|` セパレータで集団をjoinしてWasm間通信

**Status**: Accepted

## Context

Wasm（MoonBit）と JavaScript 間でデータをやり取りする際、WebAssembly のメモリモデルや wasm-gc の文字列表現の違いにより、配列をそのまま渡すことが難しい。`vite-plugin-moonbit` の wasm-gc ビルドでは `String` 型は JS のビルトイン文字列として扱われるが、`Array[String]` を直接 Wasm API の引数として渡す方法は複雑になる。集団（`population`）は複数の遺伝子文字列の配列であり、これを Wasm の `evolve` 関数に渡す必要がある。

## Decision

集団の各個体（バイナリ文字列）を `|`（パイプ）文字で join した単一の文字列として Wasm に渡し、戻り値も同様に `|` で join した文字列として受け取る方式を採用した。

- JS 側（`wasmBridge.ts`）: `population.join("|")` で渡し、結果を `.split("|")` で分割
- Wasm 側（`ga.mbt`）: `population_joined.split("|")` で分割し、`next.join("|")` で返す

セパレータ `|` は遺伝子のバイナリ文字列（`'0'`/`'1'` のみで構成）に含まれないことが保証されている。

## Consequences

### メリット
- 実装がシンプルで、Wasm/JS 双方で標準的な文字列操作のみで完結する
- `useJsBuiltinString: true` の設定と組み合わせることで文字列のコピーコストが最小化される
- バイナリ遺伝子文字列には `|` が含まれないため、セパレータの衝突がない

### トレードオフ
- 全個体を1文字列にシリアライズするため、大きな集団・長い遺伝子では文字列長が増大する（現在は集団サイズ30、最大文字数20×5=100ビットで問題なし）
- Wasm 側での文字列 split/join のコストが毎世代発生する
- セパレータの選択が暗黙の制約（バイナリ文字列に使えない文字）に依存している
