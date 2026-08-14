// エリート選択戦略
// ソート済み集団（適応度降順）の上位エリートからランダムに1体選ぶ
// fits は統一シグネチャ (ADR-021) のために受け取るが、この戦略では使用しない

///|
let elite_ratio : Double = 0.4

///|
fn elite_select(pop : Array[String], _fits : Array[Double]) -> String {
  let n = pop.length()
  let ec = (n.to_double() * elite_ratio).to_int()
  let raised = if ec < 2 { 2 } else { ec }
  // pop_size < 2 でも範囲外アクセスしないよう集団サイズでクランプ (ADR-019)
  let elite_count = if raised > n { n } else { raised }
  pop[rand_int(elite_count)]
}
