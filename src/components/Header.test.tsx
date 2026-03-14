import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

import Header from "./Header";

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  targetInput: "HELLO",
  isRunning: false,
  onChange: vi.fn(),
  onSet: vi.fn(),
  ...overrides,
});

describe("Header", () => {
  it("アプリタイトルを表示する", () => {
    const wrapper = mount(Header, { props: makeProps() });
    expect(wrapper.text()).toContain("遺伝的アルゴリズム シミュレーター");
  });

  it("targetInput の値を input に表示する", () => {
    const wrapper = mount(Header, { props: makeProps({ targetInput: "WORLD" }) });
    expect(wrapper.find("input").element.value).toBe("WORLD");
  });

  it("isRunning=true のとき input が disabled になる", () => {
    const wrapper = mount(Header, { props: makeProps({ isRunning: true }) });
    expect(wrapper.find("input").element.disabled).toBe(true);
  });

  it("isRunning=false のとき input が enabled になる", () => {
    const wrapper = mount(Header, { props: makeProps({ isRunning: false }) });
    expect(wrapper.find("input").element.disabled).toBe(false);
  });

  it("isRunning=true のときセットボタンが disabled になる", () => {
    const wrapper = mount(Header, { props: makeProps({ isRunning: true }) });
    expect(wrapper.find("button").element.disabled).toBe(true);
  });

  it("セットボタンクリックで onSet が呼ばれる", async () => {
    const onSet = vi.fn();
    const wrapper = mount(Header, { props: makeProps({ onSet }) });
    await wrapper.find("button").trigger("click");
    expect(onSet).toHaveBeenCalledOnce();
  });

  it("Enter キーで onSet が呼ばれる（isRunning=false）", async () => {
    const onSet = vi.fn();
    const wrapper = mount(Header, { props: makeProps({ onSet }) });
    await wrapper.find("input").trigger("keydown", { key: "Enter" });
    expect(onSet).toHaveBeenCalledOnce();
  });

  it("isRunning=true のとき Enter キーで onSet が呼ばれない", async () => {
    const onSet = vi.fn();
    const wrapper = mount(Header, { props: makeProps({ isRunning: true, onSet }) });
    await wrapper.find("input").trigger("keydown", { key: "Enter" });
    expect(onSet).not.toHaveBeenCalled();
  });

  it("Enter 以外のキーでは onSet が呼ばれない", async () => {
    const onSet = vi.fn();
    const wrapper = mount(Header, { props: makeProps({ onSet }) });
    await wrapper.find("input").trigger("keydown", { key: "a" });
    expect(onSet).not.toHaveBeenCalled();
  });
});
