import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, nextTick } from "vue";

import { useSimulator } from "./useSimulator";

function renderHook<T>(composable: () => T) {
  let result!: T;
  const Wrapper = defineComponent({
    setup() {
      result = composable();
      return () => undefined;
    },
  });
  mount(Wrapper, { attachTo: document.createElement("div") });
  return {
    result: {
      get value() {
        return result;
      },
    },
  };
}

vi.mock("../ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn((ind: string, target: string) => {
    let m = 0;
    for (let i = 0; i < target.length; i++) {
      if (ind[i] === target[i]) {
        m++;
      }
    }
    return m / target.length;
  }),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
}));

// fake timerは自動進化テストのみで使用。describe内のbeforeEach/afterEachでセットアップ・クリーンアップする
let usingFakeTimers = false;

afterEach(() => {
  if (usingFakeTimers) {
    vi.useRealTimers();
    usingFakeTimers = false;
  }
});

function useFakeTimersForTest() {
  vi.useFakeTimers();
  usingFakeTimers = true;
}

// ─── 初期状態 ────────────────────────────────────────────────

describe("初期状態", () => {
  it("target は HELLO WORLD", () => {
    const { result } = renderHook(() => useSimulator());
    expect(result.value[0].target).toBe("HELLO WORLD");
  });

  it("generation=0, isRunning=false, solved=false", () => {
    const { result } = renderHook(() => useSimulator());
    const [state] = result.value;
    expect(state.generation).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.solved).toBe(false);
  });

  it("population は 30 個体", () => {
    const { result } = renderHook(() => useSimulator());
    expect(result.value[0].population).toHaveLength(30);
  });

  it("actions オブジェクトが返る", () => {
    const { result } = renderHook(() => useSimulator());
    const [, actions] = result.value;
    expect(typeof actions.start).toBe("function");
    expect(typeof actions.pause).toBe("function");
    expect(typeof actions.stepOnce).toBe("function");
    expect(typeof actions.reset).toBe("function");
    expect(typeof actions.setSpeed).toBe("function");
    expect(typeof actions.applyTarget).toBe("function");
  });
});

// ─── アクション ──────────────────────────────────────────────

describe("start / pause", () => {
  it("start() で isRunning=true", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    expect(result.value[0].isRunning).toBe(true);
  });

  it("pause() で isRunning=false", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    result.value[1].pause();
    await nextTick();
    expect(result.value[0].isRunning).toBe(false);
  });
});

describe("stepOnce", () => {
  it("generation を1増やす", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].stepOnce();
    await nextTick();
    expect(result.value[0].generation).toBe(1);
  });

  it("history が1エントリー増える", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].stepOnce();
    await nextTick();
    expect(result.value[0].history).toHaveLength(2);
  });
});

describe("setSpeed", () => {
  it("speed が更新される", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].setSpeed(50);
    await nextTick();
    expect(result.value[0].speed).toBe(50);
  });
});

describe("reset", () => {
  it("stepOnce 後に reset すると generation=0", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].stepOnce();
    await nextTick();
    result.value[1].reset();
    await nextTick();
    expect(result.value[0].generation).toBe(0);
  });

  it("reset 後に speed が維持される", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].setSpeed(50);
    await nextTick();
    result.value[1].reset();
    await nextTick();
    expect(result.value[0].speed).toBe(50);
  });

  it("start() 後に reset すると isRunning=false", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    result.value[1].reset();
    await nextTick();
    expect(result.value[0].isRunning).toBe(false);
  });
});

describe("applyTarget", () => {
  it("target が変更される", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].applyTarget("VITEST");
    await nextTick();
    expect(result.value[0].target).toBe("VITEST");
  });

  it("小文字を大文字に変換する", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].applyTarget("hello");
    await nextTick();
    expect(result.value[0].target).toBe("HELLO");
  });

  it("A-Z とスペース以外の文字を除去する", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].applyTarget("HELLO123!");
    await nextTick();
    expect(result.value[0].target).toBe("HELLO");
  });

  it("20文字以上はトリムされる", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].applyTarget("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    await nextTick();
    expect(result.value[0].target).toHaveLength(20);
  });

  it("空白のみの入力は無視される", async () => {
    const { result } = renderHook(() => useSimulator());
    const originalTarget = result.value[0].target;
    result.value[1].applyTarget("   ");
    await nextTick();
    expect(result.value[0].target).toBe(originalTarget);
  });

  it("target 変更後に generation がリセットされる", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].stepOnce();
    await nextTick();
    result.value[1].applyTarget("NEW");
    await nextTick();
    expect(result.value[0].generation).toBe(0);
  });
});

describe("自動進化", () => {
  beforeEach(() => {
    useFakeTimersForTest();
  });

  it("isRunning=true 中はインターバルで世代が進む", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(result.value[0].generation).toBeGreaterThan(0);
  });

  it("pause 後はインターバルが止まる", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();
    const genAfterRun = result.value[0].generation;
    result.value[1].pause();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(result.value[0].generation).toBe(genAfterRun);
  });

  it("speed に応じたインターバルで進化する", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].setSpeed(100);
    await nextTick();
    result.value[1].start();
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(result.value[0].generation).toBeGreaterThan(0);
  });
});
