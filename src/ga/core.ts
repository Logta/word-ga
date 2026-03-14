import type { Individual, SimState } from "../types";
import { wasmCalcFitness, wasmEvolve } from "./wasmBridge";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // A=00000(0), Z=11001(25), space=11010(26)
export const BITS_PER_CHAR = 5;
export const MAX_TARGET_LEN = 20;
export const POP_SIZE = 30;
export const MUTATION_RATE = 0.03;
export const ELITE_RATIO = 0.4;
export const DEFAULT_SPEED = 300;

export const calcFitness = wasmCalcFitness;

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
export function initState(target: string, prevSpeed = DEFAULT_SPEED): SimState {
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
  if (prev.solved) { return { ...prev, isRunning: false }; }
  const binTarget = encode(prev.target);
  const newPop = wasmEvolve(prev.population, binTarget);
  const fits = newPop.map((ind) => wasmCalcFitness(ind, binTarget));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  const generation = prev.generation + 1;
  const solved = best >= 1;
  return {
    ...prev,
    population: newPop,
    generation,
    history: [...prev.history, { generation, best, avg }],
    isRunning: solved ? false : prev.isRunning,
    solved,
  };
}
