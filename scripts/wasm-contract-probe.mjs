// 実Wasmアーティファクトとの言語間契約を検証するためのプローブ。
// vitest を動かす Node は JS String Builtins 対応を保証しないため、
// 対応が確認できている Bun ランタイムで実行し、結果を JSON で標準出力へ返す。
// 使い方: bun scripts/wasm-contract-probe.mjs <path-to-src.wasm>
import { readFileSync } from "node:fs";

const wasmPath = process.argv[2];
if (!wasmPath) {
  console.error("usage: bun scripts/wasm-contract-probe.mjs <path-to-src.wasm>");
  process.exit(1);
}

const bytes = readFileSync(wasmPath);
// vite-plugin-moonbit が本番で生成するローダーと同一の instantiate オプション
const { instance } = await WebAssembly.instantiate(
  bytes,
  {},
  { builtins: ["js-string"], importedStringConstants: "_" },
);
const { calc_fitness, evolve, init_rng } = instance.exports;

// calc_fitness: TS 参照実装との一致確認用サンプル（すべて等長ペア）
const fitnessSamples = [
  ["11010", "11010"],
  ["00000", "11111"],
  ["1100", "1010"],
  ["10110", "10101"],
].map(([ind, target]) => ({ ind, target, fitness: calc_fitness(ind, target) }));

// evolve: '|' プロトコルの round-trip と決定性
const population = ["00000", "11111", "01010", "10101", "00110"];
const joined = population.join("|");
init_rng(42);
const evolvedElite = evolve(joined, "11111", "elite");
init_rng(42);
const evolvedEliteAgain = evolve(joined, "11111", "elite");
init_rng(42);
const evolvedRoulette = evolve(joined, "11111", "roulette");

// 未知の選択戦略は abort（wasm トラップ）する契約 (ADR-019)
let unknownStrategyTrapped = false;
try {
  init_rng(1);
  evolve(joined, "11111", "tournament");
} catch {
  unknownStrategyTrapped = true;
}

console.log(
  JSON.stringify({
    fitnessSamples,
    evolvedElite,
    evolvedEliteAgain,
    evolvedRoulette,
    unknownStrategyTrapped,
  }),
);
