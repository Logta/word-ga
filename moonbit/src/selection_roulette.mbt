// ルーレット選択戦略
// 適応度に比例した確率で集団から1体選ぶ
// フィットネスシフト（最小適応度を引く）で後半世代の選択圧低下を防ぐ

///|
fn roulette_select(pop : Array[String], target : String) -> String {
  let n = pop.length()
  let fitnesses : Array[Double] = pop
    .iter()
    .map(fn(ind) { calc_fitness(ind, target) })
    .collect()
  // 最小適応度を求める
  let mut min_fit = fitnesses[0]
  for f in fitnesses {
    if f < min_fit {
      min_fit = f
    }
  }
  // 最小適応度を引いて選択圧を確保
  let cumulative : Array[Double] = Array::new(capacity=n)
  let mut total = 0.0
  for f in fitnesses {
    total = total + (f - min_fit)
    cumulative.push(total)
  }
  // 全個体の調整後適応度が0（全員同適応度）の場合はランダムに返す
  if total == 0.0 {
    return pop[rand_int(n)]
  }
  let point = rand_double() * total
  let mut selected = pop[n - 1]
  let mut i = 0
  while i < n {
    if cumulative[i] > point {
      selected = pop[i]
      break
    }
    i = i + 1
  }
  selected
}
