// Whitebox tests for rng.mbt (PCG-64)

test "init_rng: 同じシードは同じ乱数列を生成する" {
  init_rng(42)
  let v1 = rand_double()
  let v2 = rand_double()
  init_rng(42)
  let v3 = rand_double()
  let v4 = rand_double()
  assert_eq(v1, v3)
  assert_eq(v2, v4)
}

test "init_rng: 異なるシードは異なる最初の値を生成する" {
  init_rng(1)
  let a = pcg_next32()
  init_rng(2)
  let b = pcg_next32()
  assert_eq(a != b, true)
}

test "rand_double: 値は[0, 1)の範囲内 (200回)" {
  init_rng(1)
  for _ in 0..<200 {
    let v = rand_double()
    assert_eq(v >= 0.0, true)
    assert_eq(v < 1.0, true)
  }
}

test "rand_double: 連続する値が全て同じにならない" {
  init_rng(1)
  let first = rand_double()
  let mut all_same = true
  for _ in 0..<20 {
    if rand_double() != first {
      all_same = false
    }
  }
  assert_eq(all_same, false)
}

test "rand_double: 0.5以上の値が生成される（全域カバー確認）" {
  // バグ時は [0, 0.25) しか生成されないため、このテストで検出できる
  init_rng(1)
  let mut found_above_half = false
  for _ in 0..<500 {
    if rand_double() >= 0.5 {
      found_above_half = true
    }
  }
  assert_eq(found_above_half, true)
}

test "rand_int: 値は[0, limit)の範囲内 (200回)" {
  init_rng(1)
  let limit = 27
  for _ in 0..<200 {
    let v = rand_int(limit)
    assert_eq(v >= 0, true)
    assert_eq(v < limit, true)
  }
}

test "pcg_next32: 出力は非負" {
  init_rng(1)
  for _ in 0..<500 {
    let v = pcg_next32().land(0x7FFFFFFF)
    assert_eq(v >= 0, true)
  }
}
