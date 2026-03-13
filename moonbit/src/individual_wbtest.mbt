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
