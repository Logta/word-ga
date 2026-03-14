// ルーレット選択戦略
// 適応度に比例した確率で集団から1体選ぶ

///|
fn roulette_select(pop : Array[String], target : String) -> String {
  let n = pop.length()
  let cumulative : Array[Double] = Array::new(capacity=n)
  let mut total = 0.0
  for ind in pop {
    total = total + calc_fitness(ind, target)
    cumulative.push(total)
  }
  // 全個体の適応度が0の場合はランダムに返す
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
