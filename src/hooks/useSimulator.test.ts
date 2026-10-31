import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, nextTick } from "vue";

import * as wasmBridge from "../ga/wasmBridge";
import { referenceFitness } from "../testUtils/referenceFitness";
import { createSeededRandom } from "../testUtils/seededRandom";
import { useSimulator } from "./useSimulator";

function renderHook<T>(composable: () => T) {
  let result!: T;
  const Wrapper = defineComponent({
    setup() {
      result = composable();
      return () => undefined;
    },
  });
  const wrapper = mount(Wrapper, { attachTo: document.createElement("div") });
  return {
    unmount: () => wrapper.unmount(),
    result: {
      get value() {
        return result;
      },
    },
  };
}

vi.mock("../ga/wasmBridge");

beforeEach(() => {
  vi.mocked(wasmBridge.wasmCalcFitness).mockImplementation(referenceFitness);
  vi.mocked(wasmBridge.wasmEvolve).mockImplementation((pop) => [...pop]);
});

afterEach(() => {
  vi.useRealTimers();
});

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

  it("reset 後に isRunning=false", async () => {
    const { result } = renderHook(() => useSimulator());
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

// ─── 自動進化（フェイクタイマー）──────────────────────────────

describe("自動進化", () => {
  it("isRunning=true 中はインターバルで世代が進む", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(result.value[0].generation).toBeGreaterThan(0);
  });

  it("pause 後はインターバルが止まる", async () => {
    vi.useFakeTimers();
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
    vi.useFakeTimers();
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

// ─── 特性化テスト（リファクタ前後の動作保証） ──────────────────

describe("characterization（リファクタ前後の動作保証）", () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, "random").mockImplementation(createSeededRandom(7));
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  // スナップショットは意味のある統計射影（history等）に絞り、
  // 乱数消費順に敏感な集団全体は不変条件で保証する
  it("stepOnce を3回実行した後の統計射影がリファクタ前後で一致する", async () => {
    const { result } = renderHook(() => useSimulator());
    for (let i = 0; i < 3; i++) {
      result.value[1].stepOnce();
      // eslint-disable-next-line no-await-in-loop -- 各世代は前世代のstateに依存するため逐次実行が必須
      await nextTick();
    }
    const [state] = result.value;
    expect({
      target: state.target,
      generation: state.generation,
      solved: state.solved,
      history: state.history,
    }).toMatchSnapshot();
    expect(state.population).toHaveLength(30);
    expect(state.fits).toHaveLength(30);
    for (const ind of state.population) {
      expect(ind).toMatch(/^[01]+$/);
    }
  });
});

// ─── mutation testing で見つかった未検出ケースの補強 ─────────────────

describe("setSelectionMethod", () => {
  it("選択戦略を切り替え、reset 後も引き継ぐ", async () => {
    const { result } = renderHook(() => useSimulator());
    result.value[1].setSelectionMethod("roulette");
    await nextTick();
    expect(result.value[0].selectionMethod).toBe("roulette");
    result.value[1].reset();
    await nextTick();
    expect(result.value[0].selectionMethod).toBe("roulette");
  });
});

describe("タイマーのライフサイクル", () => {
  it("start 直後（nextTick を待たず）にインターバルが張られる（watch は flush: sync）", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSimulator());
    result.value[1].start();
    vi.advanceTimersByTime(300);
    expect(result.value[0].generation).toBe(1);
  });

  it("アンマウント後はインターバルが解除され世代が進まない", async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useSimulator());
    result.value[1].start();
    await nextTick();
    vi.advanceTimersByTime(300);
    const genBeforeUnmount = result.value[0].generation;
    unmount();
    vi.advanceTimersByTime(3000);
    expect(result.value[0].generation).toBe(genBeforeUnmount);
    expect(vi.getTimerCount()).toBe(0);
  });
});
