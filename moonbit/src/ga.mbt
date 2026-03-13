let chars : Array[Char] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ".to_array()
let mutation_rate : Double = 0.03
let elite_ratio : Double = 0.4
let sep : String = "|"
// モジュールレベルlet mutは使えないため、Arrayの中身の可変性を利用
let rng_state : Array[Int64] = [123456789L]

fn main { }

// JavaScriptのDate.now()などで初期化する
pub fn init_rng(seed : Int) -> Unit {
  rng_state[0] = seed.to_int64()
}

// xorshift64
fn rand_next() -> Int64 {
  let mut x = rng_state[0]
  x = x.lxor(x << 13)
  x = x.lxor(x >> 7)
  x = x.lxor(x << 17)
  rng_state[0] = x
  x
}

fn rand_double() -> Double {
  let x = rand_next()
  // 負値を非負に変換（オーバーフローなし）: [-2^63,-1] → [0, 2^63-1]
  let pos = if x < 0L { -(x + 1L) } else { x }
  pos.to_double() / 9223372036854775807.0
}

fn rand_int(limit : Int) -> Int {
  // 負のmodulo結果を補正
  let r = (rand_next() % limit.to_int64()).to_int()
  if r < 0 { r + limit } else { r }
}

fn random_char() -> Char {
  chars[rand_int(chars.length())]
}

pub fn calc_fitness(ind : String, target : String) -> Double {
  let ind_arr = ind.to_array()
  let target_arr = target.to_array()
  let n = target_arr.length()
  let mut m = 0
  for i in 0..<n {
    if ind_arr[i] == target_arr[i] {
      m += 1
    }
  }
  m.to_double() / n.to_double()
}

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

fn mutate(ind : String) -> String {
  let buf = StringBuilder::new()
  for c in ind {
    if rand_double() < mutation_rate {
      buf.write_char(random_char())
    } else {
      buf.write_char(c)
    }
  }
  buf.to_string()
}

pub fn evolve(population_joined : String, target : String) -> String {
  let pop : Array[String] = population_joined.split(sep).map(fn(sv) { sv.to_string() }).collect()
  let pop_size = pop.length()
  // 適応度でソート（降順）
  pop.sort_by(fn(a, b) {
    calc_fitness(b, target).compare(calc_fitness(a, target))
  })
  let ec = (pop_size.to_double() * elite_ratio).to_int()
  let elite_count = if ec < 2 { 2 } else { ec }
  // 次世代：全員をエリートからの交叉＋突然変異で生成（TypeScriptと同じ）
  let next : Array[String] = Array::new(capacity=pop_size)
  for _ in 0..<pop_size {
    let p1 = pop[rand_int(elite_count)]
    let p2 = pop[rand_int(elite_count)]
    next.push(mutate(crossover(p1, p2)))
  }
  next.join(sep)
}
