import type { Individual, SimState } from "../types";
import { wasmCalcFitness, wasmEvolve } from "./wasmBridge";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // A=00000(0), Z=11001(25), space=11010(26)
export const POP_SIZE = 30;
export const MUTATION_RATE = 0.03;
export const ELITE_RATIO = 0.4;

export const calcFitness = wasmCalcFitness;

export function charToBin(char: string): string {
  const index = CHARS.indexOf(char);
  const safeIndex = index === -1 ? 0 : index;
  return safeIndex.toString(2).padStart(5, "0");
}

export function binToChar(bin: string): string {
  const index = parseInt(bin, 2);
  // 0-26 are mapped, 27-31 are space as requested
  return CHARS[index] || " ";
}

export function encode(text: string): string {
  return text.split("").map(charToBin).join("");
}

export function decode(bin: string): string {
  return Array.from({ length: bin.length / 5 }, (_, i) =>
    binToChar(bin.slice(i * 5, i * 5 + 5)),
  ).join("");
}

export function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .slice(0, 20);
}

function randomBit(): string {
  return Math.random() < 0.5 ? "0" : "1";
}

function randomIndividual(targetLen: number): Individual {
  // Each character is 5 bits
  return Array.from({ length: targetLen * 5 }, randomBit).join("");
}

export function initState(target: string, prevSpeed = 300): SimState {
  const binTarget = encode(target);
  const population = Array.from({ length: POP_SIZE }, () => randomIndividual(target.length));
  const fits = population.map((ind) => wasmCalcFitness(ind, binTarget));
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
  const binTarget = encode(prev.target);
  const newPop = wasmEvolve(prev.population, binTarget);
  const fits = newPop.map((ind) => wasmCalcFitness(ind, binTarget));
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
