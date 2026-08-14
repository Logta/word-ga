// 遺伝的アルゴリズム

///|
let mutation_rate : Double = 0.03

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

///|
/// 入力契約 (ADR-019): target は非空・'0'/'1' のみ、各個体は target と等長・'0'/'1' のみ
/// 契約違反は静かな誤動作（トラップ・NaN汚染）ではなく即時 abort として現す
fn validate_input(pop : Array[String], target : String) -> Unit {
  if target.length() == 0 {
    abort("evolve: target must be non-empty")
  }
  for c in target {
    if c != '0' && c != '1' {
      abort("evolve: target must be a binary string")
    }
  }
  for ind in pop {
    if ind.length() != target.length() {
      abort("evolve: individual length must match target length")
    }
    for c in ind {
      if c != '0' && c != '1' {
        abort("evolve: individual must be a binary string")
      }
    }
  }
}

///|
/// 適応度を各個体につき1回だけ計算し、(個体, 適応度) を適応度降順に並べて返す (ADR-021)
fn sort_by_fitness(
  pop : Array[String],
  target : String,
) -> (Array[String], Array[Double]) {
  let pairs : Array[(String, Double)] = pop.map(fn(ind) {
    (ind, calc_fitness(ind, target))
  })
  pairs.sort_by(fn(a, b) { b.1.compare(a.1) })
  (pairs.map(fn(p) { p.0 }), pairs.map(fn(p) { p.1 }))
}

///|
/// sel="elite": エリート選択、sel="roulette": ルーレット選択
/// 未知の戦略名は契約違反として abort する (ADR-019)
pub fn evolve(
  population_joined : String,
  target : String,
  sel : String,
) -> String {
  let pop : Array[String] = population_joined
    .split(sep)
    .map(fn(sv) { sv.to_owned() })
    .collect()
  validate_input(pop, target)
  let (sorted_pop, fits) = sort_by_fitness(pop, target)
  let select : (Array[String], Array[Double]) -> String = match sel {
    "elite" => elite_select
    "roulette" => roulette_select
    _ => abort("evolve: unknown selection method: \{sel}")
  }
  let pop_size = pop.length()
  let next : Array[String] = Array::new(capacity=pop_size)
  for _ in 0..<pop_size {
    let p1 = select(sorted_pop, fits)
    let p2 = select(sorted_pop, fits)
    next.push(mutate(crossover(p1, p2)))
  }
  next.join(sep)
}
