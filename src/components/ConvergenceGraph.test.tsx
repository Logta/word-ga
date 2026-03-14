import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("chart.js", () => ({
  Chart: { register: () => {} },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

vi.mock("vue-chartjs", async () => {
  const { h } = await import("vue");
  return {
    Line: {
      name: "Line",
      props: ["data", "options"],
      render: () => h("canvas", { "data-testid": "chart-canvas" }),
    },
  };
});

import ConvergenceGraph from "./ConvergenceGraph";

const makeHistory = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    generation: i,
    best: Math.min(1, 0.1 + i * 0.01),
    avg: Math.min(1, 0.05 + i * 0.008),
  }));

describe("ConvergenceGraph", () => {
  it("収束グラフの見出しを表示する", () => {
    const wrapper = mount(ConvergenceGraph, { props: { history: makeHistory(3) } });
    expect(wrapper.text()).toContain("収束グラフ");
  });

  it("チャートコンポーネントをレンダリングする", () => {
    const wrapper = mount(ConvergenceGraph, { props: { history: makeHistory(3) } });
    expect(wrapper.find("[data-testid=chart-canvas]").exists()).toBe(true);
  });

  it("history が空でもエラーなくレンダリングされる", () => {
    expect(() => mount(ConvergenceGraph, { props: { history: [] } })).not.toThrow();
  });

  it("150件を超えても問題なくレンダリングされる（最大表示は150件）", () => {
    const wrapper = mount(ConvergenceGraph, { props: { history: makeHistory(200) } });
    expect(wrapper.find("[data-testid=chart-canvas]").exists()).toBe(true);
  });

  it("props.history 変更後も再レンダリングされる", async () => {
    const wrapper = mount(ConvergenceGraph, { props: { history: makeHistory(5) } });
    await wrapper.setProps({ history: makeHistory(10) });
    expect(wrapper.find("[data-testid=chart-canvas]").exists()).toBe(true);
  });
});
