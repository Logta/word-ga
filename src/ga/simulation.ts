import type { HistoryEntry, Individual, SelectionMethod, SimState } from "../types";
import { calcDiversity } from "./diversity";
import { BITS_PER_CHAR, encode } from "./encoding";
import { wasmCalcFitness, wasmEvolve } from "./wasmBridge";

export const POP_SIZE = 30;
export const DEFAULT_SPEED = 300;

function randomBit(): string {
  // eslint-disable-next-line no-magic-numbers
  return Math.random() < 0.5 ? "0" : "1";
}

function randomIndividual(targetLen: number): Individual {
  // Each character is BITS_PER_CHAR bits
  return Array.from({ length: targetLen * BITS_PER_CHAR }, randomBit).join("");
}

interface Summary {
  best: number;
  fits: number[];
  historyEntry: HistoryEntry;
}

// 集団のfitsを一度だけ計算し、best/avg/historyエントリーとあわせて返す (ADR-021)
// fits は SimState に保持され、表示側は再計算せずにこれを参照する
function summarize(population: Individual[], binTarget: string, generation: number): Summary {
  if (population.length === 0) {
    throw new Error("summarize: population must be non-empty");
  }
  const fits = population.map((ind) => wasmCalcFitness(ind, binTarget));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / fits.length;
  return {
    best,
    fits,
    historyEntry: { generation, best, avg, diversity: calcDiversity(population) },
  };
}

export function initState(
  target: string,
  prevSpeed = DEFAULT_SPEED,
  prevSelectionMethod: SelectionMethod = "elite",
): SimState {
  // 空ターゲットは wasm 層で NaN 汚染を起こすため契約違反として即時拒否する (ADR-019)
  if (!target.trim()) {
    throw new Error("initState: target must be non-empty");
  }
  const binTarget = encode(target);
  const population = Array.from({ length: POP_SIZE }, () => randomIndividual(target.length));
  const { fits, historyEntry } = summarize(population, binTarget, 0);
  return {
    target,
    population,
    fits,
    generation: 0,
    history: [historyEntry],
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
  const generation = prev.generation + 1;
  const { best, fits, historyEntry } = summarize(newPop, binTarget, generation);
  const solved = best >= 1;
  return {
    ...prev,
    population: newPop,
    fits,
    generation,
    history: [...prev.history, historyEntry],
    isRunning: solved ? false : prev.isRunning,
    solved,
  };
}
