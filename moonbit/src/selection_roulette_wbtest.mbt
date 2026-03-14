// Whitebox tests for selection_roulette.mbt

///|
test "roulette_select: 返値はpopの要素" {
  init_rng(1)
  let pop = ["00000", "11111", "01010"]
  let target = "11111"
  let result = roulette_select(pop, target)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "roulette_select: 全適応度ゼロ時にクラッシュしない" {
  init_rng(1)
  let pop = ["00000", "00000", "00000"]
  let target = "11111"
  let result = roulette_select(pop, target)
  assert_eq(result == "00000", true)
}

///|
test "roulette_select: 繰り返し呼んでも常にpopの要素を返す" {
  init_rng(42)
  let pop = ["00000", "10101", "11111"]
  let target = "10101"
  for _ in 0..<20 {
    let result = roulette_select(pop, target)
    let found = pop.iter().any(fn(ind) { ind == result })
    assert_eq(found, true)
  }
}
