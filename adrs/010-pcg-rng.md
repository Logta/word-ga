# ADR-010: 乱数生成を xorshift64 から PCG に変更

**Status**: Accepted

## Context

現在の乱数生成は xorshift64（ADR-004）で実装されている。xorshift64 は実装がシンプルで周期も 2^64 と十分だが、下位ビットの統計的品質が弱く、BigCrush（最も厳しい統計テスト）を通過しない。

より高品質な乱数アルゴリズムへの移行を検討した。

### 検討した代替案

| 手法 | 周期 | 状態サイズ | 統計品質 | MoonBit 実装難度 |
|---|---|---|---|---|
| xorshift64（現状） | 2^64 | 8バイト | 良好（下位ビット弱め） | 低 |
| MT19937 | 2^19937 | 2.5KB | 非常に高い | 高（論理右シフトを要する） |
| xorshift128+ | 2^128 | 16バイト | 高い | 低 |
| **PCG-64** | **2^128** | **16バイト** | **非常に高い（BigCrush 全パス）** | **低** |

**MT19937 を不採用とした理由:**
- 状態サイズが 2.5KB（624要素）と大きく、実装コードも約80行と複雑
- MoonBit の `>>` が算術右シフトのため、MT の tempering に必要な論理右シフトをビットマスクで代替する必要があり可読性が低下する
- この GA 用途に対して過剰スペック

**PCG を採用した理由:**
- 状態は `Int64` × 2（state + increment）のみで MT19937 の 1/156 のサイズ
- 実装コードが xorshift64 とほぼ同規模（約25行）
- 論理右シフト不要（MoonBit の既知制約に抵触しない）
- BigCrush 全パスと統計的品質が最高水準
- increment を変えることで独立した複数ストリームを得られる拡張性がある

## Decision

乱数生成を xorshift64 から PCG-64（Permuted Congruential Generator）に変更する。

### アルゴリズム概要

2ステップで構成される：

1. **LCG で内部状態を更新**
   ```
   state = state × 6364136223846793005 + increment
   ```

2. **Permutation（出力変換）で品質を向上**
   ```
   xorshifted = ((state >> 18) ^ state) >> 27   // 上位32ビットを抽出
   rot        = state >> 59                       // 回転量（0〜31）
   output     = rotr32(xorshifted, rot)           // 動的ビット回転
   ```

### 変更ファイル

- `moonbit/src/rng.mbt` — PCG アルゴリズムに置き換え（`pcg_state` / `pcg_inc` を状態として使用）
- `moonbit/src/rng_wbtest.mbt` — 実装依存テスト（負値ブランチテストなど）を PCG に合わせて更新

### 外部 API は変更なし

`init_rng(seed: Int)` / `rand_double() -> Double` / `rand_int(limit: Int) -> Int` のシグネチャは維持する。

## Consequences

### メリット
- BigCrush 全パスの統計的品質（xorshift64 より高品質）
- 下位ビットの弱さが解消される
- 状態サイズは 16バイト（xorshift64 の 2倍だが MT19937 の 1/156）
- 外部 API が変わらないため wasmBridge.ts / core.ts の変更不要

### トレードオフ
- `rand_double` の実装が変わるため、同じシードで異なる乱数列が生成される（シミュレーション結果の再現性が変わる）
- xorshift64 と比べてコードがやや複雑になる（約20行 → 約30行）
- GA の収束特性への実質的な影響はない（どちらも統計的に十分な品質）
