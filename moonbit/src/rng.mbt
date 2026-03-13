// 乱数生成 (PCG-64: Permuted Congruential Generator)
// モジュールレベル let mut は使えないため Array の可変性を利用

///|
let pcg_state : Array[Int64] = [0L]

///|
let pcg_inc : Array[Int64] = [1442695040888963407L] // 奇数固定

// JavaScriptのDate.now()などで初期化する
// PCG標準初期化: 状態をゼロリセット → 1ステップ進める → シードを加算 → もう1ステップ進める（ウォームアップ）

///|
pub fn init_rng(seed : Int) -> Unit {
  pcg_state[0] = 0L
  let _ = pcg_next32()
  pcg_state[0] = pcg_state[0] + seed.to_int64()
  let _ = pcg_next32()
}

// 32ビット論理右シフト（MoonBit の >> は算術右シフトのため符号ビットをマスク）

///|
fn logical_shr32(x : Int, n : Int) -> Int {
  if n == 0 {
    x
  } else {
    (x >> n) & (0x7FFFFFFF >> (n - 1))
  }
}

// PCG-64: 32ビット出力を返す内部関数

///|
fn pcg_next32() -> Int {
  let old = pcg_state[0]
  pcg_state[0] = old * 6364136223846793005L + pcg_inc[0]
  // xorshift した上位32ビットを抽出（シフト量は Int で渡す）
  let xorshifted = (((old >> 18) ^ old) >> 27).to_int()
  // 回転量（0〜31）は状態の上位5ビットから取得
  let rot = (old >> 59).to_int() & 31
  // rotr32: 論理右シフト + 左シフトの合成
  logical_shr32(xorshifted, rot) | (xorshifted << (-rot & 31))
}

///|
fn rand_double() -> Double {
  // 符号ビットを除いた31ビット正値 → [0, 1)
  // logical_shr32(x, 1) で最上位ビットをクリアし非負を保証
  logical_shr32(pcg_next32(), 1).to_double() / 2147483648.0 // 2^31
}

///|
fn rand_int(limit : Int) -> Int {
  logical_shr32(pcg_next32(), 1) % limit
}
