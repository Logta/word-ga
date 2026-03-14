// Whitebox tests for ga.mbt

// ─── crossover ───────────────────────────────────────────────────────────────

///|
test "crossover: 出力長がp1と同じ" {
  init_rng(1)
  assert_eq(crossover("10101", "01010").length(), 5)
}

///|
test "crossover: 結果はp1プレフィックス＋p2サフィックスの構造（10回）" {
  // p1="11111", p2="00000" のとき結果は必ず "1...10...0" の形式
  // 変異 i < pt → i >= pt だと "0...01...1" になり detected できる
  init_rng(42)
  for _ in 0..<10 {
    let result = crossover("11111", "00000").to_array()
    let mut found_zero = false
    let mut valid = true
    for c in result {
      if c == '0' {
        found_zero = true
      } else if found_zero {
        // '1'が'0'の後に来るのは構造違反
        valid = false
      }
    }
    assert_eq(valid, true)
  }
}

// ─── mutate ──────────────────────────────────────────────────────────────────

///|
test "mutate: 出力長が入力と同じ" {
  init_rng(1)
  assert_eq(mutate("10101").length(), 5)
}

///|
test "mutate: 出力文字が '0' または '1'" {
  init_rng(1)
  for c in mutate("11111") {
    assert_eq(c == '0' || c == '1', true)
  }
}

///|
test "mutate: 変異率は低い（長い文字列でほとんど変化しない）" {
  // mutation_rate=0.03 なら 100文字で期待値3箇所の変異
  // 変異 rand < rate → rand > rate だと97%変化し、この検証で検出できる
  init_rng(42)
  let original = Array::make(100, "0").join("")
  let result = mutate(original)
  let mut changes = 0
  let orig_arr = original.to_array()
  let res_arr = result.to_array()
  for i in 0..<100 {
    if orig_arr[i] != res_arr[i] {
      changes = changes + 1
    }
  }
  // mutation_rate=0.03 なので 100文字中の変異数は通常20未満
  assert_eq(changes < 20, true)
}

// ─── evolve ──────────────────────────────────────────────────────────────────

///|
test "evolve(elite): 出力個体数が入力と同じ (POP_SIZE=30)" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "elite")
  let parts = result.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 30)
}

///|
test "evolve(elite): 各個体の長さがtargetと同じ" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "elite")
  for ind in result.split(sep).map(fn(sv) { sv.to_string() }).collect() {
    assert_eq(ind.length(), 5)
  }
}

///|
test "evolve(elite): 出力文字が '0' または '1'" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "elite")
  for ind in result.split(sep).map(fn(sv) { sv.to_string() }).collect() {
    for c in ind {
      assert_eq(c == '0' || c == '1', true)
    }
  }
}

///|
test "evolve(elite): pop_size=2でelite_count<2補正ブランチを通る" {
  // ec = floor(2 * 0.4) = 0 < 2 → elite_count = 2 に補正
  init_rng(42)
  let pop = Array::make(2, "10")
  let result = evolve(pop.join(sep), "01", "elite")
  let parts = result.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 2)
  for ind in parts {
    assert_eq(ind.length(), 2)
  }
}

///|
test "evolve(elite): 複数世代の連続実行で安定動作" {
  init_rng(1)
  let target = "HELLO"
  let pop = Array::make(30, "00000")
  let mut joined = pop.join(sep)
  for _ in 0..<10 {
    joined = evolve(joined, target, "elite")
  }
  let parts = joined.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 30)
}

///|
test "evolve(roulette): 複数世代の連続実行で安定動作" {
  init_rng(1)
  let target = "HELLO"
  let pop = Array::make(30, "00000")
  let mut joined = pop.join(sep)
  for _ in 0..<10 {
    joined = evolve(joined, target, "roulette")
  }
  let parts = joined.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 30)
}

///|
test "evolve(roulette): 全適応度ゼロの集団でもクラッシュしない" {
  init_rng(1)
  let pop = Array::make(5, "00000")
  let result = evolve(pop.join(sep), "11111", "roulette")
  let parts = result.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 5)
}

///|
test "evolve(unknown): 未知の選択メソッドはエリート選択にフォールバック" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "unknown_method")
  let parts = result.split(sep).map(fn(sv) { sv.to_string() }).collect()
  assert_eq(parts.length(), 30)
}
