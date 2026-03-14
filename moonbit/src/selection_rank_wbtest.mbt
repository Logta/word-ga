// Whitebox tests for selection_rank.mbt

///|
test "rank_select: 返値はpopの要素" {
  init_rng(1)
  let pop = ["00000", "11111", "01010"]
  let result = rank_select(pop)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "rank_select: 1個体のときその個体を返す" {
  init_rng(1)
  let pop = ["10101"]
  assert_eq(rank_select(pop), "10101")
}

///|
test "rank_select: 全個体が同一でもクラッシュしない" {
  init_rng(1)
  let pop = ["10101", "10101", "10101"]
  let result = rank_select(pop)
  assert_eq(result == "10101", true)
}

///|
test "evolve(rank): 複数世代の連続実行で安定動作" {
  init_rng(1)
  let target = "HELLO"
  let pop = Array::make(30, "00000")
  let mut joined = pop.join(sep)
  for _ in 0..<10 {
    joined = evolve(joined, target, "rank")
  }
  let parts = joined.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 30)
}
