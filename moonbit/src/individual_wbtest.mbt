// Whitebox tests for individual.mbt

test "random_char: 返値がCHARSに含まれる (100回)" {
  init_rng(7)
  for _ in 0..<100 {
    let c = random_char()
    let code = c.to_int()
    let valid = (code >= 65 && code <= 90) || code == 32
    assert_eq(valid, true)
  }
}

test "calc_fitness: 完全一致で1.0" {
  assert_eq(calc_fitness("HELLO", "HELLO"), 1.0)
}

test "calc_fitness: 完全不一致で0.0" {
  assert_eq(calc_fitness("ZZZZZ", "HELLO"), 0.0)
}

test "calc_fitness: 2/4一致 = 0.5 (2進数で正確な値)" {
  // "ABXX" vs "ABCD": A=A, B=B, X≠C, X≠D -> 2/4 = 0.5
  assert_eq(calc_fitness("ABXX", "ABCD"), 0.5)
}

test "calc_fitness: 3/4一致 = 0.75 (2進数で正確な値)" {
  // "ABCX" vs "ABCD": A=A, B=B, C=C, X≠D -> 3/4 = 0.75
  assert_eq(calc_fitness("ABCX", "ABCD"), 0.75)
}

test "calc_fitness: スペースを含む完全一致" {
  assert_eq(calc_fitness("HELLO WORLD", "HELLO WORLD"), 1.0)
}

test "calc_fitness: 長さ1の完全一致" {
  assert_eq(calc_fitness("A", "A"), 1.0)
}

test "calc_fitness: 長さ1の不一致" {
  assert_eq(calc_fitness("B", "A"), 0.0)
}

test "calc_fitness: スペースの一致を正しく判定する" {
  assert_eq(calc_fitness("A B", "A B"), 1.0)
}
