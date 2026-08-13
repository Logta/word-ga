import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { referenceFitness } from "../testUtils/referenceFitness";
import { createSeededRandom } from "../testUtils/seededRandom";
import { encode } from "./encoding";
import { initState, stepState, POP_SIZE, DEFAULT_SPEED } from "./simulation";
import * as wasmBridge from "./wasmBridge";

// wasmBridgeをモック（Wasm不要。手動モック: src/ga/__mocks__/wasmBridge.ts）
vi.mock("./wasmBridge");

beforeEach(() => {
  vi.mocked(wasmBridge.wasmCalcFitness).mockImplementation(referenceFitness);
  vi.mocked(wasmBridge.wasmEvolve).mockImplementation((pop) => [...pop]);
});

// ─── initState ──────────────────────────────────────────────

describe("initState", () => {
  it("target を正しく保持する", () => {
    expect(initState("HELLO").target).toBe("HELLO");
  });

  it("空・空白のみのターゲットは throw する (ADR-019)", () => {
    expect(() => initState("")).toThrow();
    expect(() => initState("   ")).toThrow();
  });

  it("POP_SIZE 個の個体を生成する", () => {
    expect(initState("HELLO").population).toHaveLength(POP_SIZE);
  });

  it("各個体の長さが target と一致する", () => {
    for (const ind of initState("HELLO WORLD").population) {
      expect(ind).toHaveLength(11 * 5);
    }
  });

  it("各文字が '0' か '1'", () => {
    for (const ind of initState("TEST").population) {
      for (const ch of ind) {
        expect(ch === "0" || ch === "1").toBe(true);
      }
    }
  });

  it("generation=0, isRunning=false, solved=false で初期化される", () => {
    const s = initState("HELLO");
    expect(s.generation).toBe(0);
    expect(s.isRunning).toBe(false);
    expect(s.solved).toBe(false);
  });

  it("fits は population と並行で各個体の適応度を保持する (ADR-021)", () => {
    const s = initState("HELLO");
    expect(s.fits).toHaveLength(POP_SIZE);
    const binTarget = encode("HELLO");
    s.population.forEach((ind, i) => {
      expect(s.fits[i]).toBeCloseTo(referenceFitness(ind, binTarget));
    });
  });

  it("history は generation=0 のエントリー1件のみ", () => {
    const { history } = initState("HELLO");
    expect(history).toHaveLength(1);
    expect(history[0].generation).toBe(0);
  });

  it("history の best/avg は [0, 1] の範囲内", () => {
    const { history } = initState("HELLO");
    expect(history[0].best).toBeGreaterThanOrEqual(0);
    expect(history[0].best).toBeLessThanOrEqual(1);
    expect(history[0].avg).toBeGreaterThanOrEqual(0);
    expect(history[0].avg).toBeLessThanOrEqual(1);
  });

  it("history の avg <= best", () => {
    const { history } = initState("HELLO");
    expect(history[0].avg).toBeLessThanOrEqual(history[0].best);
  });

  it("history の diversity は 0 以上 n/(2*(n-1)) 以下", () => {
    const { history } = initState("HELLO");
    const theoreticalMax = POP_SIZE / (2 * (POP_SIZE - 1));
    expect(history[0].diversity).toBeGreaterThanOrEqual(0);
    expect(history[0].diversity).toBeLessThanOrEqual(theoreticalMax + 1e-10);
  });

  it("デフォルト speed は DEFAULT_SPEED", () => {
    expect(initState("HELLO").speed).toBe(DEFAULT_SPEED);
  });

  it("prevSpeed が引き継がれる", () => {
    expect(initState("HELLO", 150).speed).toBe(150);
  });

  it("wasmCalcFitness を POP_SIZE 回呼び出す", () => {
    vi.mocked(wasmBridge.wasmCalcFitness).mockClear();
    initState("HELLO");
    expect(wasmBridge.wasmCalcFitness).toHaveBeenCalledTimes(POP_SIZE);
  });
});

// ─── stepState ──────────────────────────────────────────────

describe("stepState", () => {
  it("solved=true のとき世代を進めず isRunning=false を返す", () => {
    const base = initState("HI");
    const solved = { ...base, solved: true, isRunning: true };
    const next = stepState(solved);
    expect(next.isRunning).toBe(false);
    expect(next.generation).toBe(0);
    expect(next.history).toHaveLength(1);
  });

  it("generation を1増やす", () => {
    expect(stepState(initState("HELLO")).generation).toBe(1);
  });

  it("history にエントリーを追加する", () => {
    const next = stepState(initState("HELLO"));
    expect(next.history).toHaveLength(2);
    expect(next.history[1].generation).toBe(1);
  });

  it("fits が新集団と並行して更新される (ADR-021)", () => {
    const next = stepState(initState("HELLO"));
    expect(next.fits).toHaveLength(next.population.length);
    const binTarget = encode("HELLO");
    next.population.forEach((ind, i) => {
      expect(next.fits[i]).toBeCloseTo(referenceFitness(ind, binTarget));
    });
  });

  it("avg は実際の個体数で計算される（POP_SIZE固定除算の回帰検出）", () => {
    const state = initState("HI");
    vi.mocked(wasmBridge.wasmEvolve).mockReturnValue(["0000000000", "1111111111"]);
    vi.mocked(wasmBridge.wasmCalcFitness).mockReturnValue(0.5);
    const next = stepState(state);
    // 2個体 × 0.5 → avg=0.5（バグ時は sum/POP_SIZE = 1/30 ≈ 0.033 になる）
    expect(next.history[1].avg).toBeCloseTo(0.5);
  });

  it("新しい history エントリーの best/avg は [0, 1] の範囲内", () => {
    const { history } = stepState(initState("HELLO"));
    expect(history[1].best).toBeGreaterThanOrEqual(0);
    expect(history[1].best).toBeLessThanOrEqual(1);
    expect(history[1].avg).toBeGreaterThanOrEqual(0);
    expect(history[1].avg).toBeLessThanOrEqual(1);
  });

  it("新しい history エントリーの diversity は 0 以上 n/(2*(n-1)) 以下", () => {
    const { history } = stepState(initState("HELLO"));
    const theoreticalMax = POP_SIZE / (2 * (POP_SIZE - 1));
    expect(history[1].diversity).toBeGreaterThanOrEqual(0);
    expect(history[1].diversity).toBeLessThanOrEqual(theoreticalMax + 1e-10);
  });

  it("speed と target を引き継ぐ", () => {
    const state = initState("HELLO", 100);
    const next = stepState(state);
    expect(next.speed).toBe(100);
    expect(next.target).toBe("HELLO");
  });

  it("isRunning=true は solved でなければ維持される", () => {
    const state = { ...initState("HELLO"), isRunning: true };
    const next = stepState(state);
    if (!next.solved) {
      expect(next.isRunning).toBe(true);
    }
  });

  it("best=1.0 で solved=true かつ isRunning=false になる", () => {
    vi.mocked(wasmBridge.wasmEvolve).mockReturnValue(["HI", "HI"]);
    vi.mocked(wasmBridge.wasmCalcFitness).mockReturnValue(1);
    const state = { ...initState("HI"), isRunning: true };
    const next = stepState(state);
    expect(next.solved).toBe(true);
    expect(next.isRunning).toBe(false);
  });

  it("wasmEvolve を1回呼び出す", () => {
    vi.mocked(wasmBridge.wasmEvolve).mockClear();
    stepState(initState("HELLO"));
    expect(wasmBridge.wasmEvolve).toHaveBeenCalledTimes(1);
  });

  it("wasmCalcFitness を新世代の POP_SIZE 回呼び出す", () => {
    const state = initState("HELLO");
    vi.mocked(wasmBridge.wasmCalcFitness).mockClear();
    stepState(state);
    expect(wasmBridge.wasmCalcFitness).toHaveBeenCalledTimes(POP_SIZE);
  });

  it("複数ステップで history が蓄積される", () => {
    let state = initState("HELLO");
    for (let i = 0; i < 5; i++) {
      state = stepState(state);
    }
    expect(state.generation).toBe(5);
    expect(state.history).toHaveLength(6);
  });
});

// ─── 特性化テスト（リファクタ前後の動作保証） ──────────────────

describe("characterization（リファクタ前後の動作保証）", () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, "random").mockImplementation(createSeededRandom(42));
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  // スナップショットは意味のある統計射影（history等）に絞り、
  // 乱数消費順に敏感な集団全体は不変条件で保証する
  it("initState('HI') の統計射影がリファクタ前後で一致する", () => {
    const s = initState("HI");
    expect({
      target: s.target,
      generation: s.generation,
      isRunning: s.isRunning,
      speed: s.speed,
      solved: s.solved,
      selectionMethod: s.selectionMethod,
      history: s.history,
    }).toMatchSnapshot();
    expect(s.population).toHaveLength(POP_SIZE);
    for (const ind of s.population) {
      expect(ind).toMatch(/^[01]+$/);
    }
    expect(s.fits).toHaveLength(POP_SIZE);
  });

  it("stepState を3世代進めた統計射影がリファクタ前後で一致する", () => {
    let state = initState("HI");
    for (let i = 0; i < 3; i++) {
      state = stepState(state);
    }
    expect({
      target: state.target,
      generation: state.generation,
      solved: state.solved,
      history: state.history,
    }).toMatchSnapshot();
    expect(state.population).toHaveLength(POP_SIZE);
    expect(state.fits).toHaveLength(POP_SIZE);
  });
});
