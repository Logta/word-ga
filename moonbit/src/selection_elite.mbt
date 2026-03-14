// エリート選択戦略
// ソート済み集団（適応度降順）の上位エリートからランダムに1体選ぶ

///|
fn elite_select(pop : Array[String]) -> String {
  let n = pop.length()
  let ec = (n.to_double() * elite_ratio).to_int()
  let elite_count = if ec < 2 { 2 } else { ec }
  pop[rand_int(elite_count)]
}
