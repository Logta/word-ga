// Whitebox tests for selection_roulette.mbt

///|
test "roulette_select: 返値はpopの要素" {
  init_rng(1)
  let pop = ["00000", "11111", "01010"]
  let target = "11111"
  let result = roulette_select(pop, target)
  let found = pop.iter().any(fn(ind) { ind == result })
  assert_eq(found, true)
}

///|
test "roulette_select: 高適応度個体が低適応度より頻繁に選ばれる（100回）" {
  // フィットネスシフトや比較演算の変異でこの確率的プロパティが崩れる
  init_rng(42)
  let pop = ["00000", "11111"] // 適応度0 vs 1
  let target = "11111"
  let mut high_count = 0
  for _ in 0..<100 {
    if roulette_select(pop, target) == "11111" {
      high_count = high_count + 1
    }
  }
  // 高適応度個体は少なくとも過半数で選ばれるはず
  assert_eq(high_count > 50, true)
}

///|
test "roulette_select: ゼロ適応度個体は選ばれない（フィットネスシフト確認）" {
  // min_fit が正しく最小値を取得していれば、適応度=min_fit の個体はシフト後0で選ばれない
  // 変異 (< → > で最大値を取得) や (f - min_fit → f + min_fit) で
  // "00000" が誤って選ばれるようになる
  init_rng(42)
  // 昇順入力: "00000"(適応度0)が先頭。正しい実装では選ばれない
  let pop = ["00000", "10101", "11111"]
  let target = "11111"
  let mut zero_count = 0
  for _ in 0..<100 {
    if roulette_select(pop, target) == "00000" {
      zero_count = zero_count + 1
    }
  }
  assert_eq(zero_count, 0)
}

///|
test "roulette_select: 全員非ゼロ適応度のときmin_fitシフトで差分のみが寄与する" {
  // min_fit が最小値(0.6)のとき、差分は [0, 0, 0.4]。"11111"だけが選ばれる
  // 変異 f + min_fit だと差分が [1.2, 1.2, 1.6] になり他個体も選ばれる
  init_rng(42)
  let pop = ["10101", "11010", "11111"]
  let target = "11111"
  let mut top_count = 0
  for _ in 0..<100 {
    if roulette_select(pop, target) == "11111" {
      top_count = top_count + 1
    }
  }
  // 正しい実装: "11111"だけが選ばれる（他は差分0）
  assert_eq(top_count, 100)
}

///|
test "roulette_select: 全適応度ゼロ時にクラッシュしない" {
  init_rng(1)
  let pop = ["00000", "00000", "00000"]
  let target = "11111"
  let result = roulette_select(pop, target)
  assert_eq(result == "00000", true)
}

///|
test "roulette_select: 全個体同適応度の場合もクラッシュしない（フィットネスシフト後total=0）" {
  init_rng(1)
  // 全員同じ個体 → 調整後適応度がすべて0 → ランダムフォールバック
  let pop = ["10101", "10101", "10101"]
  let target = "11111"
  let result = roulette_select(pop, target)
  assert_eq(result == "10101", true)
}
