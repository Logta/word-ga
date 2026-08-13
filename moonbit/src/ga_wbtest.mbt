// Whitebox tests for ga.mbt

// ─── crossover ───────────────────────────────────────────────────────────────

///|
test "crossover: 出力長がp1と同じ" {
  init_rng(1)
  assert_eq(crossover("10101", "01010").length(), 5)
}

///|
test "crossover: 各文字はp1かp2のいずれかから" {
  init_rng(1)
  let p1 = "11111"
  let p2 = "00000"
  let p1_arr = p1.to_array()
  let p2_arr = p2.to_array()
  let result = crossover(p1, p2).to_array()
  for i in 0..<5 {
    assert_eq(result[i] == p1_arr[i] || result[i] == p2_arr[i], true)
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

// ─── sort_by_fitness ─────────────────────────────────────────────────────────

///|
test "sort_by_fitness: 適応度降順に個体と適応度が並ぶ" {
  // fitness vs "01010": "01010"→1.0, "00000"→0.6, "11111"→0.4
  let (sorted, fits) = sort_by_fitness(["00000", "11111", "01010"], "01010")
  assert_eq(sorted[0], "01010")
  assert_eq(sorted[1], "00000")
  assert_eq(sorted[2], "11111")
  assert_eq(fits[0], 1.0)
  assert_eq(fits[1], 0.6)
  assert_eq(fits[2], 0.4)
}

///|
test "sort_by_fitness: 個体と適応度の対応がソート後も保たれる" {
  let pop = ["11110", "00001", "10101"]
  let target = "10101"
  let (sorted, fits) = sort_by_fitness(pop, target)
  for i in 0..<sorted.length() {
    assert_eq(fits[i], calc_fitness(sorted[i], target))
  }
}

// ─── validate_input (ADR-019) ────────────────────────────────────────────────

///|
test "panic evolve: 空ターゲットはabort" {
  init_rng(1)
  let _ = evolve("", "", "elite")
}

///|
test "panic evolve: 非バイナリターゲットはabort" {
  init_rng(1)
  let _ = evolve("10101", "HELLO", "elite")
}

///|
test "panic evolve: 個体長がターゲットと不一致はabort" {
  init_rng(1)
  let _ = evolve("101", "11111", "elite")
}

///|
test "panic evolve: 非バイナリ個体はabort" {
  init_rng(1)
  let _ = evolve("ABCDE", "11111", "elite")
}

///|
test "panic evolve: 未知の選択戦略はabort" {
  init_rng(1)
  let _ = evolve("10101", "11111", "tournament")
}

// ─── evolve (method="elite": エリート選択) ───────────────────────────────────

///|
test "evolve(elite): 出力個体数が入力と同じ (POP_SIZE=30)" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "elite")
  let parts = result.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 30)
}

///|
test "evolve(elite): 各個体の長さがtargetと同じ" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "elite")
  for ind in result.split(sep).map(fn(sv) { sv.to_owned() }).collect() {
    assert_eq(ind.length(), 5)
  }
}

///|
test "evolve(elite): 出力文字が '0' または '1'" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "elite")
  for ind in result.split(sep).map(fn(sv) { sv.to_owned() }).collect() {
    for c in ind {
      assert_eq(c == '0' || c == '1', true)
    }
  }
}

///|
test "evolve(elite): pop_size=1でもトラップせず1個体を返す (ADR-019 クランプ)" {
  init_rng(42)
  let result = evolve("10101", "11111", "elite")
  let parts = result.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 1)
  assert_eq(parts[0].length(), 5)
}

///|
test "evolve(elite): pop_size=2でelite_count<2補正ブランチを通る" {
  // ec = floor(2 * 0.4) = 0 < 2 → elite_count = 2 に補正
  init_rng(42)
  let pop = Array::make(2, "10")
  let result = evolve(pop.join(sep), "01", "elite")
  let parts = result.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 2)
  for ind in parts {
    assert_eq(ind.length(), 2)
  }
}

///|
test "evolve(elite): pop_size=5でelite_count>=2の通常ブランチ" {
  // ec = floor(5 * 0.4) = 2 >= 2 → elite_count = 2 のままelseブランチ
  init_rng(42)
  let pop = Array::make(5, "00000")
  let result = evolve(pop.join(sep), "10110", "elite")
  let parts = result.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 5)
}

///|
test "evolve(elite): 複数世代の連続実行で安定動作" {
  init_rng(1)
  let target = "10110"
  let pop = Array::make(30, "00000")
  let mut joined = pop.join(sep)
  for _ in 0..<10 {
    joined = evolve(joined, target, "elite")
  }
  let parts = joined.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 30)
}

// ─── evolve (method="roulette": ルーレット選択) ──────────────────────────────

///|
test "evolve(roulette): 出力個体数が入力と同じ (POP_SIZE=30)" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "roulette")
  let parts = result.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 30)
}

///|
test "evolve(roulette): 各個体の長さがtargetと同じ" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "roulette")
  for ind in result.split(sep).map(fn(sv) { sv.to_owned() }).collect() {
    assert_eq(ind.length(), 5)
  }
}

///|
test "evolve(roulette): 出力文字が '0' または '1'" {
  init_rng(42)
  let pop = Array::make(30, "00000")
  let result = evolve(pop.join(sep), "11111", "roulette")
  for ind in result.split(sep).map(fn(sv) { sv.to_owned() }).collect() {
    for c in ind {
      assert_eq(c == '0' || c == '1', true)
    }
  }
}

///|
test "evolve(roulette): 複数世代の連続実行で安定動作" {
  init_rng(1)
  let target = "10110"
  let pop = Array::make(30, "00000")
  let mut joined = pop.join(sep)
  for _ in 0..<10 {
    joined = evolve(joined, target, "roulette")
  }
  let parts = joined.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 30)
}

///|
test "evolve(roulette): 全適応度ゼロの集団でもクラッシュしない" {
  init_rng(1)
  let pop = Array::make(5, "00000")
  let result = evolve(pop.join(sep), "11111", "roulette")
  let parts = result.split(sep).map(fn(sv) { sv.to_owned() }).collect()
  assert_eq(parts.length(), 5)
}
