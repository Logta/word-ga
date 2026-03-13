// Whitebox tests for rng.mbt

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
  let a = rand_next()
  init_rng(2)
  let b = rand_next()
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

test "rand_double: 負のrand_next出力を正しく処理する" {
  // seed=1で繰り返すと負のInt64が生成され、else側ではなくif側(x<0)ブランチを踏む
  init_rng(1)
  let mut found_negative_branch = false
  for _ in 0..<500 {
    let x = rand_next()
    if x < 0L {
      found_negative_branch = true
    }
  }
  assert_eq(found_negative_branch, true)
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

test "rand_int: 負のmodulo補正ブランチを踏む" {
  // rand_next()が負のとき r = negative % limit < 0 → r + limit で補正
  init_rng(1)
  let mut hit_negative = false
  for _ in 0..<500 {
    let x = rand_next()
    let limit = 12
    let r = (x % limit.to_int64()).to_int()
    if r < 0 {
      hit_negative = true
    }
  }
  assert_eq(hit_negative, true)
}
