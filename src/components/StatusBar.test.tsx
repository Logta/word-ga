import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";

import { encode } from "../ga/core";
import StatusBar from "./StatusBar";

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  generation: 10,
  bestFit: 0.75,
  avgFit: 0.5,
  bestInd: encode("HELLO"),
  target: "HELLO",
  ...overrides,
});

describe("StatusBar", () => {
  it("世代数を表示する", () => {
    const wrapper = mount(StatusBar, { props: makeProps({ generation: 42 }) });
    expect(wrapper.text()).toContain("42");
  });

  it("bestFit をパーセンテージで表示する", () => {
    const wrapper = mount(StatusBar, { props: makeProps({ bestFit: 0.75 }) });
    expect(wrapper.text()).toContain("75.0%");
  });

  it("avgFit をパーセンテージで表示する", () => {
    const wrapper = mount(StatusBar, { props: makeProps({ avgFit: 0.5 }) });
    expect(wrapper.text()).toContain("50.0%");
  });

  it("100% の場合も正しく表示する", () => {
    const wrapper = mount(StatusBar, { props: makeProps({ bestFit: 1 }) });
    expect(wrapper.text()).toContain("100.0%");
  });

  it("セクションラベルをすべて表示する", () => {
    const wrapper = mount(StatusBar, { props: makeProps() });
    expect(wrapper.text()).toContain("世代");
    expect(wrapper.text()).toContain("最高適応度");
    expect(wrapper.text()).toContain("平均適応度");
    expect(wrapper.text()).toContain("ベスト個体");
  });

  it("GeneDisplay 経由でベスト個体の文字を色分け表示する", () => {
    // 完全一致 → green spans
    const wrapper = mount(StatusBar, {
      props: makeProps({ bestInd: encode("HELLO"), target: "HELLO" }),
    });
    const greenSpans = wrapper.findAll("span").filter((s) => s.classes("text-green-400"));
    expect(greenSpans.length).toBe(5);
  });

  it("不一致文字は red でレンダリングされる", () => {
    const wrapper = mount(StatusBar, {
      props: makeProps({ bestInd: encode("WORLD"), target: "HELLO" }),
    });
    const redSpans = wrapper.findAll("span").filter((s) => s.classes("text-red-400"));
    expect(redSpans.length).toBeGreaterThan(0);
  });
});
