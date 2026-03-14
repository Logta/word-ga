---
name: moonbit
description: MoonBitコードの実装・編集・テスト・ビルド作業。wasm-gc固有の文字列操作、型制約、乱数の落とし穴、パッケージ構成、テスト方法を含む
---

# MoonBit 実装時の考慮事項

## 文字列操作

- `String[i]` は `UInt16` を返す → 文字単位で扱う場合は `to_array()` で `Array[Char]` に変換する
- `String.split(sep)` は `Iter[StringView]` を返す → `Array[String]` が必要な場合は `.map(fn(sv) { sv.to_string() }).collect()` でチェーンする
- 文字列スライス `s[a:b]` はランタイムエラーになることがある → 文字ごとのループで代替する

```moonbit
// NG: s[0:3]
// OK:
let buf = StringBuilder::new()
for i in 0..<3 {
  buf.write_char(s.to_array()[i])
}
buf.to_string()
```

## 型・演算

- `Int64` の `>>` は算術右シフト（符号ビット維持）→ `rand_int` など非負整数が必要な場合は負のmodulo補正が必要
- モジュールレベルの `let mut` は使えない → `Array[T]` の要素可変性で代替する
- `method` は予約語 → パラメータ名に使わない（`sel` など別名を使う）

## 乱数

- `@random.Rand::new()` は wasm-gc で固定シードになる → JS 側から `init_rng(seed: Int)` をエクスポートして `Date.now()` でシードする（ADR-004）

## パッケージ構成

- 同じパッケージ内のファイルは名前空間を共有する → `import` 不要、ファイルを責務ごとに分割できる
- `is_main: true` のパッケージには `fn main { }` が必要（空でも可）
- エクスポートする関数は `moon.pkg` の `link.wasm-gc.exports` に列挙する

## テスト

- ホワイトボックステスト（プライベート関数アクセス）は `*_wbtest.mbt` ファイルで書く
- テスト内アサーション: `assert_eq(a, b)`（`assert_eq!` は deprecated）
- `Iter` に `foldi` はない → インデックス付き走査はカウンタ変数付きの `while` ループで書く

```moonbit
// OK: while ループでインデックス管理
let mut i = 0
while i < arr.length() {
  // arr[i] を使う処理
  i = i + 1
}
```

## ビルド・カバレッジ

```bash
# ビルド
(cd moonbit && moon build --target wasm-gc --release)

# テスト
cd moonbit && moon test --target wasm-gc

# カバレッジ（古いデータが残るとエラーになるため必ず clean してから実行）
cd moonbit && moon coverage clean && moon test --enable-coverage && moon coverage report -f summary
```

## Wasm エクスポート設計

- 集団（`Array[String]`）は `|` セパレータで join した単一 String として Wasm に渡す（ADR-008）
- JS ↔ Wasm 間で配列を直接渡すことはできないため、文字列シリアライズを使う
- 整数フラグ（`sel: Int` など）で戦略・モードを切り替える設計が Wasm API をシンプルに保つ
