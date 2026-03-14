import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  initState,
  stepState,
  calcDiversity,
  sanitize,
  CHARS,
  POP_SIZE,
  charToBin,
  binToChar,
  encode,
  decode,
} from "./core";
import * as wasmBridge from "./wasmBridge";

// wasmBridgeをモック（Wasm不要）
vi.mock("./wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));

// 参照実装：文字一致率を計算
function calcFitnessRef(ind: string, target: string): number {
  let m = 0;
  for (let i = 0; i < target.length; i++) {
    if (ind[i] === target[i]) {
      m++;
    }
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
});

// ─── encode / decode ────────────────────────────────────────

describe("encode / decode", () => {
  it("charToBin('Z') === '11001'", () => {
    expect(charToBin("Z")).toBe("11001");
  });

  it("charToBin(' ') === '11010'", () => {
    expect(charToBin(" ")).toBe("11010");
  });

  it("charToBin で未知の文字は '00000' (A) にフォールバック", () => {
    // index === -1 ガードを確認。変異 (除去) で -1.toString(2) になる
    expect(charToBin("@")).toBe("00000");
  });

  it("binToChar('11001') === 'Z'", () => {
    expect(binToChar("11001")).toBe("Z");
  });

  it("binToChar('11010') === ' '", () => {
    expect(binToChar("11010")).toBe(" ");
  });

  it("binToChar index 27-30 はスペースにフォールバック", () => {
    // インデックス 27-31 は CHARS の範囲外 → ' ' を返す
    for (const bin of ["11011", "11100", "11101", "11110", "11111"]) {
      expect(binToChar(bin)).toBe(" ");
    }
  });

  it("encode/decode ラウンドトリップ（A-Z, スペース）", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
    expect(decode(encode(chars))).toBe(chars);
  });
});

// ─── sanitize ───────────────────────────────────────────────

describe("sanitize", () => {
  it("小文字を大文字に変換する", () => {
    expect(sanitize("hello")).toBe("HELLO");
  });

  it("A-Z とスペース以外の文字を除去する", () => {
    expect(sanitize("HELLO123!")).toBe("HELLO");
  });

  it("数字・記号をすべて除去する", () => {
    expect(sanitize("A1B2C3")).toBe("ABC");
  });

  it("20文字以上はトリムされる", () => {
    expect(sanitize("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toHaveLength(20);
  });

  it("空白を含む文字列はそのまま通す", () => {
    expect(sanitize("HELLO WORLD")).toBe("HELLO WORLD");
  });
});

// ─── calcDiversity ──────────────────────────────────────────

describe("calcDiversity", () => {
  it("空配列のとき 0 を返す", () => {
    expect(calcDiversity([])).toBe(0);
  });

  it("個体が空文字列のとき 0 を返す（L=0 ガード）", () => {
    expect(calcDiversity(["", "", ""])).toBe(0);
  });

  it("個体数 1 のとき 0 を返す", () => {
    expect(calcDiversity(["1010"])).toBe(0);
  });

  it("全個体が同一のとき 0 を返す", () => {
    expect(calcDiversity(["0000", "0000", "0000"])).toBe(0);
  });

  it("完全に相補的な2個体のとき最大値 1.0 を返す（n=2 の理論最大値は 1.0）", () => {
    expect(calcDiversity(["0000", "1111"])).toBeCloseTo(1);
  });

  it("均等分布な集団は 0.3 より大きい多様性を持つ", () => {
    // 決定論的: 5個体が「00000」、5個体が「11111」
    const pop = [...Array(5).fill("00000"), ...Array(5).fill("11111")];
    expect(calcDiversity(pop)).toBeGreaterThan(0.3);
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

  it("history の diversity は 0 以上 n/(2*(n-1)) 以下", () => {
    const { history } = initState("HELLO");
    const theoreticalMax = POP_SIZE / (2 * (POP_SIZE - 1));
    expect(history[0].diversity).toBeGreaterThanOrEqual(0);
    expect(history[0].diversity).toBeLessThanOrEqual(theoreticalMax + 1e-10);
  });

  it("デフォルト speed は300", () => {
    expect(initState("HELLO").speed).toBe(300);
  });

  it("prevSpeed が引き継がれる", () => {
    expect(initState("HELLO", 150).speed).toBe(150);
  });

  it("デフォルト selectionMethod は elite", () => {
    expect(initState("HELLO").selectionMethod).toBe("elite");
  });

  it("prevSelectionMethod が引き継がれる", () => {
    expect(initState("HELLO", 300, "roulette").selectionMethod).toBe("roulette");
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
    // calcFitnessRef は HELLO に対して 0 未満にはならないため solved=false が保証される
    const state = { ...initState("HELLO"), isRunning: true };
    const next = stepState(state);
    expect(next.isRunning).toBe(true);
  });

  it("history の best は全個体中の最大適応度（Math.max確認）", () => {
    // wasmEvolve が [高, 低, 中] を返す。best = max(0.9, 0.2, 0.3) = 0.9
    // 変異 Math.max → Math.min だと 0.2 になり検出できる
    const state = initState("HI");
    vi.mocked(wasmBridge.wasmEvolve).mockReturnValueOnce(["A", "B", "C"]);
    vi.mocked(wasmBridge.wasmCalcFitness)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.3);
    const next = stepState({ ...state, population: ["A", "B", "C"] });
    expect(next.history[1].best).toBeCloseTo(0.9);
  });

  it("best=1.0 で solved=true かつ isRunning=false になる", () => {
    vi.mocked(wasmBridge.wasmEvolve).mockReturnValue(["HI", "HI"]);
    vi.mocked(wasmBridge.wasmCalcFitness).mockReturnValue(1);
    const state = { ...initState("HI"), isRunning: true };
    const next = stepState(state);
    expect(next.solved).toBe(true);
    expect(next.isRunning).toBe(false);
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
