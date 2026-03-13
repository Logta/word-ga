import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSimulator } from "./useSimulator";

vi.mock("../ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn((ind: string, target: string) => {
    let m = 0;
    for (let i = 0; i < target.length; i++) {
      if (ind[i] === target[i]) m++;
    }
    return m / target.length;
  }),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
}));

afterEach(() => {
  vi.useRealTimers();
});

// ─── 初期状態 ────────────────────────────────────────────────

describe("初期状態", () => {
  it("target は HELLO WORLD", () => {
    const { result } = renderHook(() => useSimulator());
    expect(result.current[0].target).toBe("HELLO WORLD");
  });

  it("generation=0, isRunning=false, solved=false", () => {
    const { result } = renderHook(() => useSimulator());
    const [state] = result.current;
    expect(state.generation).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.solved).toBe(false);
  });

  it("population は 30 個体", () => {
    const { result } = renderHook(() => useSimulator());
    expect(result.current[0].population).toHaveLength(30);
  });

  it("wasmReady は常に true", () => {
    const { result } = renderHook(() => useSimulator());
    expect(result.current[2]).toBe(true);
  });
});

// ─── アクション ──────────────────────────────────────────────

describe("start / pause", () => {
  it("start() で isRunning=true", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].start());
    expect(result.current[0].isRunning).toBe(true);
  });

  it("pause() で isRunning=false", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].start());
    act(() => result.current[1].pause());
    expect(result.current[0].isRunning).toBe(false);
  });
});

describe("stepOnce", () => {
  it("generation を1増やす", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].stepOnce());
    expect(result.current[0].generation).toBe(1);
  });

  it("history が1エントリー増える", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].stepOnce());
    expect(result.current[0].history).toHaveLength(2);
  });
});

describe("setSpeed", () => {
  it("speed が更新される", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].setSpeed(50));
    expect(result.current[0].speed).toBe(50);
  });
});

describe("reset", () => {
  it("stepOnce 後に reset すると generation=0", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].stepOnce());
    act(() => result.current[1].reset());
    expect(result.current[0].generation).toBe(0);
  });

  it("reset 後に speed が維持される", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].setSpeed(50));
    act(() => result.current[1].reset());
    expect(result.current[0].speed).toBe(50);
  });

  it("reset 後に isRunning=false", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].reset());
    expect(result.current[0].isRunning).toBe(false);
  });
});

describe("applyTarget", () => {
  it("target が変更される", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].applyTarget("VITEST"));
    expect(result.current[0].target).toBe("VITEST");
  });

  it("小文字を大文字に変換する", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].applyTarget("hello"));
    expect(result.current[0].target).toBe("HELLO");
  });

  it("A-Z とスペース以外の文字を除去する", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].applyTarget("HELLO123!"));
    expect(result.current[0].target).toBe("HELLO");
  });

  it("20文字以上はトリムされる", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].applyTarget("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
    expect(result.current[0].target).toHaveLength(20);
  });

  it("空白のみの入力は無視される", () => {
    const { result } = renderHook(() => useSimulator());
    const originalTarget = result.current[0].target;
    act(() => result.current[1].applyTarget("   "));
    expect(result.current[0].target).toBe(originalTarget);
  });

  it("target 変更後に generation がリセットされる", () => {
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].stepOnce());
    act(() => result.current[1].applyTarget("NEW"));
    expect(result.current[0].generation).toBe(0);
  });
});

// ─── 自動進化（フェイクタイマー）──────────────────────────────

describe("自動進化", () => {
  it("isRunning=true 中はインターバルで世代が進む", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].start());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current[0].generation).toBeGreaterThan(0);
  });

  it("pause 後はインターバルが止まる", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].start());
    act(() => vi.advanceTimersByTime(300));
    const genAfterRun = result.current[0].generation;
    act(() => result.current[1].pause());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current[0].generation).toBe(genAfterRun);
  });

  it("speed に応じたインターバルで進化する", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulator());
    act(() => result.current[1].setSpeed(100));
    act(() => result.current[1].start());
    act(() => vi.advanceTimersByTime(100));
    expect(result.current[0].generation).toBeGreaterThan(0);
  });
});
