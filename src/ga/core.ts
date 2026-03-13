import type { Individual, SimState } from "../types";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
export const POP_SIZE = 30;
export const MUTATION_RATE = 0.03;
export const ELITE_RATIO = 0.4;

export function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export function randomIndividual(len: number): Individual {
  return Array.from({ length: len }, randomChar).join("");
}

export function calcFitness(ind: Individual, target: string): number {
  let matches = 0;
  for (let i = 0; i < target.length; i++) {
    if (ind[i] === target[i]) matches++;
  }
  return matches / target.length;
}

function crossover(p1: Individual, p2: Individual): Individual {
  const pt = Math.floor(Math.random() * p1.length);
  return p1.slice(0, pt) + p2.slice(pt);
}

function mutate(ind: Individual): Individual {
  return ind
    .split("")
    .map((ch) => (Math.random() < MUTATION_RATE ? randomChar() : ch))
    .join("");
}

export function evolve(pop: Individual[], target: string): Individual[] {
  const sorted = [...pop].sort(
    (a, b) => calcFitness(b, target) - calcFitness(a, target)
  );
  const eliteCount = Math.max(2, Math.floor(POP_SIZE * ELITE_RATIO));
  const elites = sorted.slice(0, eliteCount);
  return Array.from({ length: POP_SIZE }, () => {
    const p1 = elites[Math.floor(Math.random() * elites.length)];
    const p2 = elites[Math.floor(Math.random() * elites.length)];
    return mutate(crossover(p1, p2));
  });
}

export function initState(target: string, prevSpeed = 300): SimState {
  const population = Array.from({ length: POP_SIZE }, () =>
    randomIndividual(target.length)
  );
  const fits = population.map((ind) => calcFitness(ind, target));
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
  const newPop = evolve(prev.population, prev.target);
  const fits = newPop.map((ind) => calcFitness(ind, prev.target));
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
