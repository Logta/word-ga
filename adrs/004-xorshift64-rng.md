# ADR-004: xorshift64 + JS側シードで乱数生成

**Status**: Accepted

## Context

MoonBit の標準ライブラリ `@random.Rand::new()` は `wasm-gc` ターゲットで固定シードになるという制約があり、毎回同じ乱数列が生成されてしまう。遺伝的アルゴリズムでは毎回異なるランダムな初期集団と進化が必要なため、外部からシードを注入できる乱数生成器が必要だった。また、`wasm-gc` ではモジュールレベルの `let mut` 変数が使えないという制約も考慮する必要があった。

## Decision

xorshift64 アルゴリズムを MoonBit で実装し、JS 側から `init_rng(seed: Int)` を呼び出してシードを注入する方式を採用した。状態は `let rng_state: Array[Int64] = [123456789L]` として可変配列の要素として保持することで、モジュールレベル `let mut` の制約を回避している。

JS 側では `Date.now() ^ Math.floor(Math.random() * 0x7fffffff)` でシードを生成し、Wasm 初期化直後に `init_rng` を呼び出す（`wasmBridge.ts`）。

xorshift64 の実装:
```
x ^= x << 13
x ^= x >> 7   // 算術右シフト（符号ビット維持）
x ^= x << 17
```

`rand_int` では `Int64` の算術右シフトによる負のモジュロ結果を `r + limit` で補正している。

## Consequences

### メリット
- 毎回異なるシードにより、リプレイを避けた多様な進化が実現できる
- xorshift64 は実装がシンプルで高速、GAの用途には十分な品質
- `init_rng` を公開 API として export することで JS 側から柔軟にシード制御できる

### トレードオフ
- xorshift64 は暗号学的に安全ではない（GAには問題なし）
- JS 側の `Date.now()` は精度がミリ秒単位のため、同一ミリ秒内の初期化では `Math.random()` との XOR で差異を出している
- `Int64` の算術右シフトによる負値補正が必要で、実装に注意が要る
