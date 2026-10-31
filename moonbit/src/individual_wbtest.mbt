// Whitebox tests for individual.mbt

///|
test "random_bit: 返値が '0' または '1' (100回)" {
  init_rng(7)
  for _ in 0..<100 {
    let c = random_bit()
    let valid = c == '0' || c == '1'
    assert_eq(valid, true)
  }
}

///|
test "calc_fitness: 完全一致で1.0" {
  assert_eq(calc_fitness("10101", "10101"), 1.0)
}

///|
test "calc_fitness: 完全不一致で0.0" {
  assert_eq(calc_fitness("00000", "11111"), 0.0)
}

///|
test "calc_fitness: 2/4一致 = 0.5" {
  assert_eq(calc_fitness("1100", "1010"), 0.5)
}

// ─── 入力契約 (ADR-019) ──────────────────────────────────────────────────────

///|
test "panic calc_fitness: 空ターゲットはabort" {
  let _ = calc_fitness("", "")
}

///|
test "panic calc_fitness: 個体長がターゲットと不一致はabort" {
  let _ = calc_fitness("10", "1010")
}

///|
test "random_bit: '0' と '1' がほぼ等確率で出る" {
  init_rng(5)
  let mut zeros = 0
  for _ in 0..<1000 {
    if random_bit() == '0' {
      zeros += 1
    }
  }
  // 期待値 500（標準偏差 約 16）。片方に偏る実装や 1/3 になる実装を検出する
  assert_eq(zeros > 420, true)
  assert_eq(zeros < 580, true)
}
