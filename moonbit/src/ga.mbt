// 遺伝的アルゴリズム

///|
let mutation_rate : Double = 0.03

///|
let elite_ratio : Double = 0.4

///|
let sep : String = "|"

///|
fn main {

}

///|
fn crossover(p1 : String, p2 : String) -> String {
  let pt = rand_int(p1.length())
  let p1_arr = p1.to_array()
  let p2_arr = p2.to_array()
  let buf = StringBuilder::new()
  for i in 0..<p1_arr.length() {
    if i < pt {
      buf.write_char(p1_arr[i])
    } else {
      buf.write_char(p2_arr[i])
    }
  }
  buf.to_string()
}

///|
fn mutate(ind : String) -> String {
  let buf = StringBuilder::new()
  for c in ind {
    if rand_double() < mutation_rate {
      buf.write_char(random_bit())
    } else {
      buf.write_char(c)
    }
  }
  buf.to_string()
}

///| sel=0: エリート選択、sel=1: ルーレット選択
pub fn evolve(population_joined : String, target : String, sel : Int) -> String {
  let pop : Array[String] = population_joined
    .split(sep)
    .map(fn(sv) { sv.to_string() })
    .collect()
  let pop_size = pop.length()
  // 適応度でソート（降順）
  pop.sort_by(fn(a, b) {
    calc_fitness(b, target).compare(calc_fitness(a, target))
  })
  let next : Array[String] = Array::new(capacity=pop_size)
  let select = if sel == 1 {
    fn(p : Array[String]) { roulette_select(p, target) }
  } else {
    fn(p : Array[String]) { elite_select(p) }
  }
  for _ in 0..<pop_size {
    let p1 = select(pop)
    let p2 = select(pop)
    next.push(mutate(crossover(p1, p2)))
  }
  next.join(sep)
}
