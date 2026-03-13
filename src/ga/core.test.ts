import { describe, it, expect, vi, beforeEach } from "vitest";
import * as wasmBridge from "./wasmBridge";
import {
  initState,
  stepState,
  CHARS,
  POP_SIZE,
  MUTATION_RATE,
  ELITE_RATIO,
  charToBin,
  binToChar,
  encode,
  decode,
} from "./core";

// wasmBridgeをモック（Wasm不要）
vi.mock("./wasmBridge", () => ({
  wasmCalcFitness: vi.fn(),
  wasmEvolve: vi.fn(),
}));

// 参照実装：文字一致率を計算
function calcFitnessRef(ind: string, target: string): number {
  let m = 0;
  for (let i = 0; i < target.length; i++) {
    if (ind[i] === target[i]) m++;
  }
  return m / target.length;
}

beforeEach(() => {
  vi.mocked(wasmBridge.wasmCalcFitness).mockImplementation(calcFitnessRef);
  vi.mocked(wasmBridge.wasmEvolve).mockImplementation((pop) => [...pop]);
});

// ─── 定数 ───────────────────────────────────────────────────

describe("constants", () => {
  it("CHARS はA-Zとスペースの27文字", () => {
    expect(CHARS).toHaveLength(27);
    expect(CHARS).toContain(" ");
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      expect(CHARS).toContain(c);
    }
  });

  it("POP_SIZE は30", () => {
    expect(POP_SIZE).toBe(30);
  });

  it("MUTATION_RATE は0.03", () => {
    expect(MUTATION_RATE).toBeCloseTo(0.03);
  });

  it("ELITE_RATIO は0.4", () => {
    expect(ELITE_RATIO).toBeCloseTo(0.4);
  });
});

// ─── encode / decode ────────────────────────────────────────

describe("encode / decode", () => {
  it("charToBin('A') === '00000'", () => {
    expect(charToBin("A")).toBe("00000");
  });

  it("charToBin('Z') === '11001'", () => {
    expect(charToBin("Z")).toBe("11001");
  });

  it("charToBin(' ') === '11010'", () => {
    expect(charToBin(" ")).toBe("11010");
  });

  it("binToChar('00000') === 'A'", () => {
    expect(binToChar("00000")).toBe("A");
  });

  it("binToChar('11001') === 'Z'", () => {
    expect(binToChar("11001")).toBe("Z");
  });

  it("binToChar('11010') === ' '", () => {
    expect(binToChar("11010")).toBe(" ");
  });

  it("binToChar('11111') === ' ' (index 31 はスペース)", () => {
    expect(binToChar("11111")).toBe(" ");
  });

  it("encode('A') === '00000'", () => {
    expect(encode("A")).toBe("00000");
  });

  it("decode('00000') === 'A'", () => {
    expect(decode("00000")).toBe("A");
  });

  it("encode/decode ラウンドトリップ（A-Z, スペース）", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
    expect(decode(encode(chars))).toBe(chars);
  });
});

// ─── initState ──────────────────────────────────────────────

describe("initState", () => {
  it("target を正しく保持する", () => {
    expect(initState("HELLO").target).toBe("HELLO");
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

  it("デフォルト speed は300", () => {
    expect(initState("HELLO").speed).toBe(300);
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

  it("新しい history エントリーの best/avg は [0, 1] の範囲内", () => {
    const { history } = stepState(initState("HELLO"));
    expect(history[1].best).toBeGreaterThanOrEqual(0);
    expect(history[1].best).toBeLessThanOrEqual(1);
    expect(history[1].avg).toBeGreaterThanOrEqual(0);
    expect(history[1].avg).toBeLessThanOrEqual(1);
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
    vi.mocked(wasmBridge.wasmCalcFitness).mockReturnValue(1.0);
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
    for (let i = 0; i < 5; i++) state = stepState(state);
    expect(state.generation).toBe(5);
    expect(state.history).toHaveLength(6);
  });
});
