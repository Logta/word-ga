import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

// core.ts が wasmBridge を参照するため CI 環境でも解決できるようモックする
vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));

import { encode } from "../ga/core";
import IndividualList from "./IndividualList";

/** n 個の個体を適応度降順で生成 */
const makeSorted = (count: number, fitStart = 0.9, fitStep = 0.05) =>
  Array.from({ length: count }, (_, i) => ({
    ind: encode("HELLO"),
    fit: Math.max(0, fitStart - i * fitStep),
  }));

describe("IndividualList", () => {
  it("見出しを表示する", () => {
    const wrapper = mount(IndividualList, { props: { sorted: makeSorted(1), target: "HELLO" } });
    expect(wrapper.text()).toContain("個体リスト");
  });

  it("個体数分の行をレンダリングする", () => {
    const wrapper = mount(IndividualList, { props: { sorted: makeSorted(5), target: "HELLO" } });
    // 各行に順位番号が表示される
    for (let i = 1; i <= 5; i++) {
      expect(wrapper.text()).toContain(String(i));
    }
  });

  it("上位3個体にスター(★)を表示する", () => {
    const wrapper = mount(IndividualList, { props: { sorted: makeSorted(5), target: "HELLO" } });
    const stars = wrapper.findAll("span").filter((s) => s.text() === "★");
    expect(stars).toHaveLength(3);
  });

  it("エリート以外にドット(·)を表示する", () => {
    const wrapper = mount(IndividualList, { props: { sorted: makeSorted(5), target: "HELLO" } });
    const dots = wrapper.findAll("span").filter((s) => s.text() === "·");
    expect(dots).toHaveLength(2);
  });

  it("エリート行は yellow スタイルを持つ", () => {
    const wrapper = mount(IndividualList, { props: { sorted: makeSorted(1), target: "HELLO" } });
    expect(wrapper.find("[class*=yellow-900]").exists()).toBe(true);
  });

  it("エリート個体の適応度バーは bg-yellow-400", () => {
    const wrapper = mount(IndividualList, {
      props: { sorted: [{ ind: encode("HELLO"), fit: 0.9 }], target: "HELLO" },
    });
    expect(wrapper.find(".bg-yellow-400").exists()).toBe(true);
  });

  it("fit >= 0.8 の非エリート個体の適応度バーは bg-green-400", () => {
    // 4個体: 3エリート + 1非エリート(fit=0.81)
    const sorted = [
      { ind: encode("HELLO"), fit: 0.95 },
      { ind: encode("HELLO"), fit: 0.92 },
      { ind: encode("HELLO"), fit: 0.88 },
      { ind: encode("HELLO"), fit: 0.81 }, // 非エリート, fit >= 0.8
    ];
    const wrapper = mount(IndividualList, { props: { sorted, target: "HELLO" } });
    expect(wrapper.find(".bg-green-400").exists()).toBe(true);
  });

  it("0.5 <= fit < 0.8 の非エリート個体の適応度バーは bg-blue-400", () => {
    const sorted = [
      { ind: encode("HELLO"), fit: 0.95 },
      { ind: encode("HELLO"), fit: 0.92 },
      { ind: encode("HELLO"), fit: 0.88 },
      { ind: encode("HELLO"), fit: 0.6 }, // 非エリート, 0.5 <= fit < 0.8
    ];
    const wrapper = mount(IndividualList, { props: { sorted, target: "HELLO" } });
    expect(wrapper.find(".bg-blue-400").exists()).toBe(true);
  });

  it("fit < 0.5 の非エリート個体の適応度バーは bg-gray-500", () => {
    const sorted = [
      { ind: encode("HELLO"), fit: 0.95 },
      { ind: encode("HELLO"), fit: 0.92 },
      { ind: encode("HELLO"), fit: 0.88 },
      { ind: encode("HELLO"), fit: 0.3 }, // 非エリート, fit < 0.5
    ];
    const wrapper = mount(IndividualList, { props: { sorted, target: "HELLO" } });
    expect(wrapper.find(".bg-gray-500").exists()).toBe(true);
  });

  it("適応度バーの幅が fit に対応した % になっている", () => {
    const sorted = [{ ind: encode("HELLO"), fit: 0.6 }];
    const wrapper = mount(IndividualList, { props: { sorted, target: "HELLO" } });
    const bar = wrapper.findAll("[style]").find((el) => el.attributes("style")?.includes("60%"));
    expect(bar).toBeDefined();
  });

  it("空リストのとき何もレンダリングしない", () => {
    const wrapper = mount(IndividualList, { props: { sorted: [], target: "HELLO" } });
    expect(wrapper.findAll("span").filter((s) => s.text() === "★")).toHaveLength(0);
  });

  it("適応度をパーセント表示する", () => {
    const wrapper = mount(IndividualList, {
      props: { sorted: [{ ind: encode("HELLO"), fit: 0.75 }], target: "HELLO" },
    });
    expect(wrapper.text()).toContain("75%");
  });
});
