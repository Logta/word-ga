import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("chart.js", () => ({
  Chart: class {
    static register() {}
  },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Title: class {},
  Tooltip: class {},
  Legend: class {},
}));

vi.mock("vue-chartjs", async () => {
  const { h } = await import("vue");
  return {
    Line: {
      name: "Line",
      props: ["data", "options"],
      render: () => h("div", { "data-testid": "chart" }),
    },
  };
});

vi.mock("./ga/wasmBridge", () => ({
  wasmCalcFitness: vi.fn().mockReturnValue(0),
  wasmEvolve: vi.fn((pop: string[]) => [...pop]),
  initWasm: vi.fn().mockResolvedValue(undefined),
}));

import App from "./App";

const baseState = {
  target: "HELLO WORLD",
  population: [],
  generation: 3,
  history: [{ generation: 3, best: 0.8, avg: 0.6 }],
  isRunning: false,
  speed: 300,
  solved: false,
};

const baseActions = {
  start: vi.fn(),
  pause: vi.fn(),
  stepOnce: vi.fn(),
  reset: vi.fn(),
  setSpeed: vi.fn(),
  applyTarget: vi.fn(),
};

vi.mock("./hooks/useSimulator", () => ({ useSimulator: vi.fn(() => [baseState, baseActions]) }));

describe("App", () => {
  it("エラーなくレンダリングされる", () => {
    expect(() => mount(App)).not.toThrow();
  });

  it("世代数が表示される", () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain("3");
  });

  it("solved=false のとき収束バナーを表示しない", () => {
    const wrapper = mount(App);
    expect(wrapper.text()).not.toContain("解発見");
  });

  it("solved=true のとき収束バナーを表示する", async () => {
    const { useSimulator } = await import("./hooks/useSimulator");
    vi.mocked(useSimulator).mockReturnValueOnce([
      { ...baseState, solved: true, generation: 10 },
      baseActions,
    ]);
    const wrapper = mount(App);
    expect(wrapper.text()).toContain("解発見");
    expect(wrapper.text()).toContain("10");
  });

  it("主要な子コンポーネントがすべてレンダリングされる", () => {
    const wrapper = mount(App);
    // ターゲット入力・ラベル
    expect(wrapper.text()).toContain("ターゲット");
    // コントロール
    expect(wrapper.text()).toContain("開始");
    // ステータスバー
    expect(wrapper.text()).toContain("世代");
    // 個体リスト
    expect(wrapper.text()).toContain("個体リスト");
    // 収束グラフ
    expect(wrapper.text()).toContain("収束グラフ");
  });
});
