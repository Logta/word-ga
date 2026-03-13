// 乱数生成 (xorshift64)
// モジュールレベル let mut は使えないため Array の可変性を利用
let rng_state : Array[Int64] = [123456789L]

// i64の最大値（2^63 - 1）を Double で表した値
let int64_max_f : Double = 9223372036854775807.0

// JavaScriptのDate.now()などで初期化する
pub fn init_rng(seed : Int) -> Unit {
  rng_state[0] = seed.to_int64()
}

fn rand_next() -> Int64 {
  let mut x = rng_state[0]
  x = x.lxor(x << 13)
  x = x.lxor(x >> 7)
  x = x.lxor(x << 17)
  rng_state[0] = x
  x
}

fn rand_double() -> Double {
  let x = rand_next()
  // 負値を非負に変換（オーバーフローなし）: [-2^63,-1] → [0, 2^63-1]
  let pos = if x < 0L { -(x + 1L) } else { x }
  pos.to_double() / int64_max_f
}

fn rand_int(limit : Int) -> Int {
  // 負のmodulo結果を補正
  let r = (rand_next() % limit.to_int64()).to_int()
  if r < 0 { r + limit } else { r }
}
