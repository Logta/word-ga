// Whitebox tests for selection_roulette.mbt
// roulette_select は事前計算済みの適応度配列を受け取る (ADR-021)

///|
test "roulette_select: 返値はpopの要素" {
  init_rng(1)
  let pop = ["00000", "11111", "01010"]
  let fits = [0.0, 1.0, 0.4]
  let result = roulette_select(pop, fits)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "roulette_select: 全適応度ゼロ時にクラッシュしない" {
  init_rng(1)
  let pop = ["00000", "00000", "00000"]
  let result = roulette_select(pop, [0.0, 0.0, 0.0])
  assert_eq(result == "00000", true)
}

///|
test "roulette_select: 全個体同適応度の場合もクラッシュしない（フィットネスシフト後total=0）" {
  init_rng(1)
  // 全員同適応度 → 調整後適応度がすべて0 → ランダムフォールバック
  let pop = ["10101", "10101", "10101"]
  let result = roulette_select(pop, [0.6, 0.6, 0.6])
  assert_eq(result == "10101", true)
}

///|
test "roulette_select: 繰り返し呼んでも常にpopの要素を返す" {
  init_rng(42)
  let pop = ["00000", "10101", "11111"]
  let fits = [0.2, 0.6, 1.0]
  for _ in 0..<20 {
    let result = roulette_select(pop, fits)
    let found = pop.iter().any(fn(ind) { ind == result })
    assert_eq(found, true)
  }
}

///|
test "roulette_select: 選択確率が適応度に比例する（分布検証）" {
  // fits [1.0, 0.5, 0.0] → シフト後 [1.0, 0.5, 0.0]
  // P(high)=2/3, P(mid)=1/3, P(low)=0（最小適応度の個体は選択圧0になる仕様）
  init_rng(7)
  let pop = ["11111", "10101", "00000"]
  let fits = [1.0, 0.5, 0.0]
  let mut high_count = 0
  let mut mid_count = 0
  let mut low_count = 0
  for _ in 0..<300 {
    let result = roulette_select(pop, fits)
    if result == "11111" {
      high_count += 1
    }
    if result == "10101" {
      mid_count += 1
    }
    if result == "00000" {
      low_count += 1
    }
  }
  // 定数選択・一様選択・比例の逆転をいずれも検出できる
  assert_eq(high_count > mid_count, true)
  assert_eq(mid_count > 0, true)
  assert_eq(low_count, 0)
  assert_eq(high_count + mid_count, 300)
}
