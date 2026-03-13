// 個体・適応度

// バイナリ表現 ('0' or '1')

///|
fn random_bit() -> Char {
  if rand_int(2) == 0 {
    '0'
  } else {
    '1'
  }
}

///|
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
  // ビット単位での一致度
  m.to_double() / n.to_double()
}
