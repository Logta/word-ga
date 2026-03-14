import type { Individual, SelectionMethod, SimState } from "../types";
import { wasmCalcFitness, wasmEvolve } from "./wasmBridge";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // A=00000(0), Z=11001(25), space=11010(26)
export const BITS_PER_CHAR = 5;
export const MAX_TARGET_LEN = 20;
export const POP_SIZE = 30;
export const MUTATION_RATE = 0.03;
export const ELITE_RATIO = 0.4;
export const DEFAULT_SPEED = 300;

export const calcFitness = wasmCalcFitness;

// 平均ペアワイズハミング距離を染色体長で正規化した多様性指標
// 理論最大値は n/(2*(n-1))。n=30 では約 0.517、n→∞ で 0.5 に収束
// 各ビット位置で 1 の個数 k を数えれば k*(n-k) が「そのビットで差がある個体ペア数」になる
export function calcDiversity(population: Individual[]): number {
  const n = population.length;
  if (n < 2) return 0;
  const L = population[0].length;
  if (L === 0) return 0;
  let totalDiff = 0;
  for (let p = 0; p < L; p++) {
    let ones = 0;
    for (const ind of population) {
      if (ind[p] === "1") ones++;
    }
    totalDiff += ones * (n - ones);
  }
  const pairs = (n * (n - 1)) / 2;
  return totalDiff / pairs / L;
}

export function charToBin(char: string): string {
  const index = CHARS.indexOf(char);
  const safeIndex = index === -1 ? 0 : index;
  // eslint-disable-next-line no-magic-numbers
  return safeIndex.toString(2).padStart(BITS_PER_CHAR, "0");
}

export function binToChar(bin: string): string {
  const index = parseInt(bin, 2);
  // 0-26 are mapped, 27-31 are space as requested
  return CHARS[index] || " ";
}

export function encode(text: string): string {
  return [...text].map(charToBin).join("");
}

export function decode(bin: string): string {
  return Array.from({ length: bin.length / BITS_PER_CHAR }, (_, i) =>
    binToChar(bin.slice(i * BITS_PER_CHAR, i * BITS_PER_CHAR + BITS_PER_CHAR)),
  ).join("");
}

export function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .slice(0, MAX_TARGET_LEN);
}

function randomBit(): string {
  // eslint-disable-next-line no-magic-numbers
  return Math.random() < 0.5 ? "0" : "1";
}

function randomIndividual(targetLen: number): Individual {
  // Each character is BITS_PER_CHAR bits
  return Array.from({ length: targetLen * BITS_PER_CHAR }, randomBit).join("");
}

// eslint-disable-next-line no-magic-numbers
export function initState(
  target: string,
  prevSpeed = DEFAULT_SPEED,
  prevSelectionMethod: SelectionMethod = "elite",
): SimState {
  const binTarget = encode(target);
  const population = Array.from({ length: POP_SIZE }, () => randomIndividual(target.length));
  const fits = population.map((ind) => wasmCalcFitness(ind, binTarget));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  return {
    target,
    population,
    generation: 0,
    history: [{ generation: 0, best, avg, diversity: calcDiversity(population) }],
    isRunning: false,
    speed: prevSpeed,
    solved: false,
    selectionMethod: prevSelectionMethod,
  };
}

export function stepState(prev: SimState): SimState {
  if (prev.solved) {
    return { ...prev, isRunning: false };
  }
  const binTarget = encode(prev.target);
  const newPop = wasmEvolve(prev.population, binTarget, prev.selectionMethod);
  const fits = newPop.map((ind) => wasmCalcFitness(ind, binTarget));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  const generation = prev.generation + 1;
  const solved = best >= 1;
  return {
    ...prev,
    population: newPop,
    generation,
    history: [...prev.history, { generation, best, avg, diversity: calcDiversity(newPop) }],
    isRunning: solved ? false : prev.isRunning,
    solved,
  };
}
