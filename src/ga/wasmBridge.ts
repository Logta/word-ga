import type { init } from "mbt:ga-core/src";

type GaWasmExports = Awaited<ReturnType<typeof init>>["exports"];

const SEP = "|";
let _exports: GaWasmExports | null = null;

export async function initWasm(): Promise<void> {
  const { init } = await import("mbt:ga-core/src");
  const { exports } = await init();
  _exports = exports;
  _exports.init_rng((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0);
}

function wasm(): GaWasmExports {
  if (!_exports) throw new Error("Wasm not initialized");
  return _exports;
}

export function wasmCalcFitness(ind: string, target: string): number {
  return wasm().calc_fitness(ind, target);
}

export function wasmEvolve(population: string[], target: string): string[] {
  return wasm().evolve(population.join(SEP), target).split(SEP);
}
