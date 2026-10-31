import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("mbt:ga-core/src", () => mocks);

describe("wasmBridge", () => {
  it("initWasm 前に wasmCalcFitness を呼ぶとエラーを投げる", async () => {
    vi.resetModules();
    const { wasmCalcFitness } = await import("./wasmBridge");
    expect(() => wasmCalcFitness("0", "0")).toThrow("Wasm not initialized");
  });

  it("initWasm 前に wasmEvolve を呼ぶとエラーを投げる", async () => {
    vi.resetModules();
    const { wasmEvolve } = await import("./wasmBridge");
    expect(() => wasmEvolve(["0"], "0", "elite")).toThrow("Wasm not initialized");
  });

  it("initWasm 後は wasmCalcFitness が calc_fitness へ委譲する", async () => {
    vi.resetModules();
    const calc_fitness = vi.fn().mockReturnValue(0.5);
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness, evolve: vi.fn(), init_rng: vi.fn() },
    });
    const { initWasm, wasmCalcFitness } = await import("./wasmBridge");
    await initWasm();
    expect(wasmCalcFitness("1010", "1111")).toBe(0.5);
    expect(calc_fitness).toHaveBeenCalledWith("1010", "1111");
  });

  it("wasmEvolve は population を '|' で結合して evolve に渡し、結果を分割して返す", async () => {
    vi.resetModules();
    const evolve = vi.fn().mockReturnValue("00|11|10");
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness: vi.fn(), evolve, init_rng: vi.fn() },
    });
    const { initWasm, wasmEvolve } = await import("./wasmBridge");
    await initWasm();
    const result = wasmEvolve(["00", "11", "01"], "target", "elite");
    expect(evolve).toHaveBeenCalledWith("00|11|01", "target", "elite");
    expect(result).toEqual(["00", "11", "10"]);
  });

  it("initWasm は init_rng を1回呼び出す", async () => {
    vi.resetModules();
    const init_rng = vi.fn();
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness: vi.fn(), evolve: vi.fn(), init_rng },
    });
    const { initWasm } = await import("./wasmBridge");
    await initWasm();
    expect(init_rng).toHaveBeenCalledOnce();
  });

  it("wasmEvolve の選択戦略は省略時に elite になる", async () => {
    vi.resetModules();
    const evolve = vi.fn().mockReturnValue("0");
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness: vi.fn(), evolve, init_rng: vi.fn() },
    });
    const { initWasm, wasmEvolve } = await import("./wasmBridge");
    await initWasm();
    wasmEvolve(["0"], "1");
    expect(evolve).toHaveBeenCalledWith("0", "1", "elite");
  });

  it("init_rng のシードは Date.now() と Math.random() * 0x7fffffff の XOR になる", async () => {
    vi.resetModules();
    const init_rng = vi.fn();
    mocks.init.mockResolvedValueOnce({
      exports: { calc_fitness: vi.fn(), evolve: vi.fn(), init_rng },
    });
    const now = vi.spyOn(Date, "now").mockReturnValue(0b1010);
    const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    try {
      const { initWasm } = await import("./wasmBridge");
      await initWasm();
      // floor(0.5 * 0x7fffffff) = 0x3fffffff
      expect(init_rng).toHaveBeenCalledWith(0x3fff_ffff ^ 0b1010);
    } finally {
      now.mockRestore();
      random.mockRestore();
    }
  });
});
