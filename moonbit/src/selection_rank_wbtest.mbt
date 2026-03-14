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
test "rank_select: 上位個体が下位より頻繁に選ばれる（100回）" {
  // 重みの計算や比較演算の変異でこのプロパティが崩れる
  init_rng(42)
  let pop = ["11111", "10101", "00000"] // 降順ソート済み（重み3:2:1）
  let mut top_count = 0
  let mut bottom_count = 0
  for _ in 0..<100 {
    let result = rank_select(pop)
    if result == "11111" {
      top_count = top_count + 1
    }
    if result == "00000" {
      bottom_count = bottom_count + 1
    }
  }
  // 上位(重み3)は下位(重み1)より多く選ばれるはず
  assert_eq(top_count > bottom_count, true)
}

///|
test "rank_select: 最下位個体も確率的に選ばれる（線形ランキング確認）" {
  // n=3, 重み [3, 2, 1], total=6 → "00000" の期待選択率 = 1/6 ≈ 16.7%
  // 変異 (n - i → n + i) だと [3, 4, 5] だが total=6 のままなので
  // 累積がすぐ total を超え、"00000" が選ばれなくなる
  init_rng(42)
  let pop = ["11111", "10101", "00000"]
  let mut bottom_count = 0
  for _ in 0..<300 {
    if rank_select(pop) == "00000" {
      bottom_count = bottom_count + 1
    }
  }
  // 期待値 ~50回 (300 * 1/6)。変異後は 0 になる
  assert_eq(bottom_count > 10, true)
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
