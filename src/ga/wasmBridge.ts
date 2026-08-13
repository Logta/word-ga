import type { init } from "mbt:ga-core/src";

import type { SelectionMethod } from "../types";

type GaWasmExports = Awaited<ReturnType<typeof init>>["exports"];

const SEP = "|";
let wasmExports: GaWasmExports | undefined;

export async function initWasm(): Promise<void> {
  const { init } = await import("mbt:ga-core/src");
  const { exports } = await init();
  wasmExports = exports;
  // eslint-disable-next-line no-magic-numbers
  wasmExports.init_rng((Date.now() ^ Math.floor(Math.random() * 0x7fff_ffff)) | 0);
}

function wasm(): GaWasmExports {
  if (wasmExports === undefined) {
    throw new Error("Wasm not initialized");
  }
  return wasmExports;
}

export function wasmCalcFitness(ind: string, target: string): number {
  return wasm().calc_fitness(ind, target);
}

export function wasmEvolve(
  population: string[],
  target: string,
  selectionMethod: SelectionMethod = "elite",
): string[] {
  return wasm().evolve(population.join(SEP), target, selectionMethod).split(SEP);
}
