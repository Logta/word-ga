// Wasm関数の型
interface GaWasmExports {
  calc_fitness: (ind: string, target: string) => number;
  evolve: (popJoined: string, target: string) => string;
}

const SEP = "|";
let _exports: GaWasmExports | null = null;

export async function initWasm(): Promise<void> {
  const { init } = await import("mbt:ga-core/src");
  const instance = await init();
  _exports = instance.exports as unknown as GaWasmExports;
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
