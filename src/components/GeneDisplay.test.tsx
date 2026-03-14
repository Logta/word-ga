import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

// core.ts が wasmBridge を参照するため CI 環境でも解決できるようモックする
vi.mock("../ga/wasmBridge", () => ({ wasmCalcFitness: vi.fn(), wasmEvolve: vi.fn() }));

import { encode } from "../ga/core";
import GeneDisplay from "./GeneDisplay";

describe("GeneDisplay", () => {
  it("一致文字は green-400 でレンダリングされる", () => {
    const wrapper = mount(GeneDisplay, { props: { ind: encode("A"), target: "A" } });
    expect(wrapper.find("span").classes()).toContain("text-green-400");
    expect(wrapper.find("span").text()).toBe("A");
  });

  it("不一致文字は red-400 でレンダリングされる", () => {
    const wrapper = mount(GeneDisplay, { props: { ind: encode("B"), target: "A" } });
    expect(wrapper.find("span").classes()).toContain("text-red-400");
  });

  it("スペースは NBSP としてレンダリングされる", () => {
    const wrapper = mount(GeneDisplay, { props: { ind: encode(" "), target: "X" } });
    // text() は空白を正規化するため textContent で NBSP を確認する
    expect(wrapper.find("span").element.textContent).toBe("\u00A0");
  });

  it("文字数分の span をレンダリングする", () => {
    const wrapper = mount(GeneDisplay, { props: { ind: encode("HELLO"), target: "HELLO" } });
    expect(wrapper.findAll("span")).toHaveLength(5);
  });

  it("一致・不一致が混在する場合に正しく色分けされる", () => {
    // "AB" vs "AC": A は一致(green)、B vs C は不一致(red)
    const wrapper = mount(GeneDisplay, { props: { ind: encode("AB"), target: "AC" } });
    const spans = wrapper.findAll("span");
    expect(spans[0].classes()).toContain("text-green-400");
    expect(spans[1].classes()).toContain("text-red-400");
  });

  it("空の ind では span を一切レンダリングしない", () => {
    const wrapper = mount(GeneDisplay, { props: { ind: "", target: "HELLO" } });
    expect(wrapper.findAll("span")).toHaveLength(0);
  });
});
