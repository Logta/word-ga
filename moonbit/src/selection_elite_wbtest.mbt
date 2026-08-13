// Whitebox tests for selection_elite.mbt
// elite_select は「適応度降順にソート済みの集団」を前提とする（evolve がソートしてから渡す）

///|
test "elite_select: 返値はpopの要素" {
  init_rng(1)
  let pop = ["11111", "10101", "00000"]
  let fits = [1.0, 0.6, 0.0]
  let result = elite_select(pop, fits)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "elite_select: elite_count<2補正 (pop_size=2)" {
  // ec = floor(2 * 0.4) = 0 < 2 → elite_count = 2 に補正
  init_rng(1)
  let pop = ["11111", "00000"]
  let fits = [1.0, 0.0]
  let result = elite_select(pop, fits)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "elite_select: pop_size=1でも範囲外アクセスしない (ADR-019 クランプ)" {
  init_rng(1)
  assert_eq(elite_select(["10101"], [0.6]), "10101")
}

///|
test "elite_select: pop_size=5でインデックス2以降は選ばれない" {
  // elite_count = max(2, floor(5 * 0.4)) = max(2, 2) = 2
  // → インデックス 0 か 1 のみ選ばれる
  init_rng(99)
  let pop = ["11111", "11110", "00011", "00001", "00000"]
  let fits = [1.0, 0.8, 0.4, 0.2, 0.0]
  for _ in 0..<100 {
    let result = elite_select(pop, fits)
    assert_eq(result == "11111" || result == "11110", true)
  }
}

///|
test "elite_select: エリート上位2個体の両方が選ばれうる（定数選択ミュータント検出）" {
  init_rng(42)
  let pop = ["11111", "11110", "00011", "00001", "00000"]
  let fits = [1.0, 0.8, 0.4, 0.2, 0.0]
  let mut first_count = 0
  let mut second_count = 0
  for _ in 0..<100 {
    let result = elite_select(pop, fits)
    if result == "11111" {
      first_count += 1
    }
    if result == "11110" {
      second_count += 1
    }
  }
  // 常に pop[0] を返す縮退実装ならどちらかが0になる
  assert_eq(first_count > 0, true)
  assert_eq(second_count > 0, true)
  assert_eq(first_count + second_count, 100)
}
