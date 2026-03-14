#!/usr/bin/env node
// MoonBit mutation testing script
// 各 mutation を適用して moon test が失敗する（= mutation が検出される）ことを確認する

import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "src");

let killed = 0;
let survived = 0;
const survivedList = [];

/** moon test を実行し、テストが失敗した (= mutation が検出された) ときに true を返す */
function runTests() {
  const result = spawnSync("moon", ["test", "--target", "wasm-gc"], {
    cwd: __dirname,
    stdio: "pipe",
    timeout: 60_000,
  });
  return result.status !== 0;
}

/**
 * ファイルに1件だけ mutation を適用してテストを実行し、元に戻す
 * @param {string} relFile - src/ 以下の相対パス
 * @param {string} description - mutation の説明
 * @param {string} original - 置換前の文字列（完全一致）
 * @param {string} mutated - 置換後の文字列
 */
function mutate(relFile, description, original, mutated) {
  const file = join(SRC, relFile);
  const content = readFileSync(file, "utf-8");

  if (!content.includes(original)) {
    console.log(`SKIP  ${description}  (pattern not found)`);
    return;
  }

  // 1回だけ置換（最初の出現のみ）
  const mutatedContent = content.replace(original, mutated);
  writeFileSync(file, mutatedContent);

  let isKilled = false;
  try {
    isKilled = runTests();
  } finally {
    // 必ず元に戻す
    writeFileSync(file, content);
  }

  if (isKilled) {
    console.log(`✓ KILLED   ${description}`);
    killed++;
  } else {
    console.log(`✗ SURVIVED ${description}`);
    survivedList.push(`${relFile}: ${description}`);
    survived++;
  }
}

// ─── individual.mbt ──────────────────────────────────────────────────────────

console.log("\n=== individual.mbt ===");

mutate(
  "individual.mbt",
  "calc_fitness: 一致を != に反転",
  "if ind_arr[i] == target_arr[i] {",
  "if ind_arr[i] != target_arr[i] {",
);

mutate(
  "individual.mbt",
  "calc_fitness: 除算 / を乗算 * に変更",
  "m.to_double() / n.to_double()",
  "m.to_double() * n.to_double()",
);

mutate(
  "individual.mbt",
  "calc_fitness: m += 1 を m -= 1 に変更",
  "m += 1",
  "m -= 1",
);

// ─── ga.mbt ──────────────────────────────────────────────────────────────────

console.log("\n=== ga.mbt ===");

mutate(
  "ga.mbt",
  "crossover: i < pt を i >= pt に反転（全ビットをp2から取る）",
  "if i < pt {",
  "if i >= pt {",
);

mutate(
  "ga.mbt",
  "mutate: rand_double() < を > に反転（mutation_rate補数）",
  "if rand_double() < mutation_rate {",
  "if rand_double() > mutation_rate {",
);

// ─── selection_elite.mbt ────────────────────────────────────────────────────

console.log("\n=== selection_elite.mbt ===");

mutate(
  "selection_elite.mbt",
  "elite_select: ec < 2 を ec > 2 に反転（補正方向を逆に）",
  "let elite_count = if ec < 2 { 2 } else { ec }",
  "let elite_count = if ec > 2 { 2 } else { ec }",
);

mutate(
  "selection_elite.mbt",
  "elite_select: elite_ratio 乗算 * を + に変更",
  "n.to_double() * elite_ratio",
  "n.to_double() + elite_ratio",
);

// ─── selection_roulette.mbt ─────────────────────────────────────────────────

console.log("\n=== selection_roulette.mbt ===");

mutate(
  "selection_roulette.mbt",
  "roulette_select: min_fit の < を > に反転（最大値をシフト）",
  "if f < min_fit {",
  "if f > min_fit {",
);

mutate(
  "selection_roulette.mbt",
  "roulette_select: フィットネスシフト f - min_fit を f + min_fit に変更",
  "total = total + (f - min_fit)",
  "total = total + (f + min_fit)",
);

mutate(
  "selection_roulette.mbt",
  "roulette_select: total == 0.0 を != に反転（ゼロ判定逆）",
  "if total == 0.0 {",
  "if total != 0.0 {",
);

mutate(
  "selection_roulette.mbt",
  "roulette_select: cumulative[i] > point を < に反転",
  "if cumulative[i] > point {",
  "if cumulative[i] < point {",
);

// ─── selection_rank.mbt ─────────────────────────────────────────────────────

console.log("\n=== selection_rank.mbt ===");

mutate(
  "selection_rank.mbt",
  "rank_select: n*(n+1)/2 の /2 を *2 に変更（合計重み4倍）",
  "let total = n * (n + 1) / 2",
  "let total = n * (n + 1) * 2",
);

mutate(
  "selection_rank.mbt",
  "rank_select: 重み (n - i) を (n + i) に変更（昇順重みに反転）",
  "cumulative = cumulative + (n - i)",
  "cumulative = cumulative + (n + i)",
);

mutate(
  "selection_rank.mbt",
  "rank_select: cumulative > point を < に反転",
  "if cumulative > point {",
  "if cumulative < point {",
);

// ─── Summary ─────────────────────────────────────────────────────────────────

const total = killed + survived;
const score = total > 0 ? Math.round((killed / total) * 100) : 0;

console.log("\n─── Mutation Score ────────────────────────────────────────────");
console.log(`Killed:    ${killed}/${total} (${score}%)`);
console.log(`Survived:  ${survived}`);

if (survivedList.length > 0) {
  console.log("\nSurvived mutations:");
  for (const m of survivedList) {
    console.log(`  - ${m}`);
  }
}

process.exit(survived > 0 ? 1 : 0);
