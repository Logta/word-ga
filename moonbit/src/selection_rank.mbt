// ランク選択戦略
// 適応度の絶対値ではなく順位に比例した確率で選ぶ（線形ランキング）
// ソート済み集団（降順）で位置 i の重みは (n - i)
//   最良(i=0): 重み n、最悪(i=n-1): 重み 1
// 合計重み = n*(n+1)/2
// 文字列長に依存しない一定の選択圧が維持できる

///|
fn rank_select(pop : Array[String]) -> String {
  let n = pop.length()
  // 合計重み = 1 + 2 + ... + n = n*(n+1)/2
  let total = n * (n + 1) / 2
  let point = rand_int(total)
  let mut cumulative = 0
  let mut i = 0
  while i < n {
    cumulative = cumulative + (n - i)
    if cumulative > point {
      return pop[i]
    }
    i = i + 1
  }
  pop[n - 1]
}
