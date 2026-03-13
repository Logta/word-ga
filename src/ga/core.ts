import type { Individual, SimState } from "../types";
import { wasmCalcFitness, wasmEvolve } from "./wasmBridge";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
export const POP_SIZE = 30;
export const MUTATION_RATE = 0.03;
export const ELITE_RATIO = 0.4;

// wasmBridgeへの後方互換エクスポート
export const calcFitness = wasmCalcFitness;

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function randomIndividual(len: number): Individual {
  return Array.from({ length: len }, randomChar).join("");
}

export function initState(target: string, prevSpeed = 300): SimState {
  const population = Array.from({ length: POP_SIZE }, () =>
    randomIndividual(target.length)
  );
  const fits = population.map((ind) => wasmCalcFitness(ind, target));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  return {
    target,
    population,
    generation: 0,
    history: [{ generation: 0, best, avg }],
    isRunning: false,
    speed: prevSpeed,
    solved: false,
  };
}

export function stepState(prev: SimState): SimState {
  if (prev.solved) return { ...prev, isRunning: false };
  const newPop = wasmEvolve(prev.population, prev.target);
  const fits = newPop.map((ind) => wasmCalcFitness(ind, prev.target));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  const generation = prev.generation + 1;
  const solved = best >= 1.0;
  return {
    ...prev,
    population: newPop,
    generation,
    history: [...prev.history, { generation, best, avg }],
    isRunning: solved ? false : prev.isRunning,
    solved,
  };
}
