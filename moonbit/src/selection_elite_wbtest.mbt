// Whitebox tests for selection_elite.mbt

///|
test "elite_select: 返値はpopの要素" {
  init_rng(1)
  let pop = ["11111", "10101", "00000"]
  let result = elite_select(pop)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "elite_select: elite_count<2補正 (pop_size=2)" {
  // ec = floor(2 * 0.4) = 0 < 2 → elite_count = 2 に補正
  init_rng(1)
  let pop = ["11111", "00000"]
  let result = elite_select(pop)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "elite_select: 繰り返し呼んでも常にpopの要素を返す" {
  init_rng(42)
  let pop = Array::make(30, "10101")
  pop[0] = "11111"
  pop[1] = "11110"
  for _ in 0..<50 {
    let result = elite_select(pop)
    let found = pop.iter().any(fn(ind) { ind == result })
    assert_eq(found, true)
  }
}

///|
test "elite_select: pop_size=5でインデックス2以降は選ばれない" {
  // elite_count = max(2, floor(5 * 0.4)) = max(2, 2) = 2
  // → インデックス 0 か 1 のみ選ばれる
  init_rng(99)
  let pop = ["AAAAA", "BBBBB", "CCCCC", "DDDDD", "EEEEE"]
  for _ in 0..<100 {
    let result = elite_select(pop)
    assert_eq(result == "AAAAA" || result == "BBBBB", true)
  }
}
