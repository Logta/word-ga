import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

import Controls from "./Controls";

// SPEED_MIN=100, SPEED_MAX=1000 (Controls.tsx の定数に合わせる)
const SPEED_MIN = 100;
const SPEED_MAX = 1000;

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  isRunning: false,
  solved: false,
  speed: 300,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onStepOnce: vi.fn(),
  onReset: vi.fn(),
  onSpeedChange: vi.fn(),
  ...overrides,
});

describe("Controls", () => {
  it("isRunning=false のとき開始ボタンを表示する", () => {
    const wrapper = mount(Controls, { props: makeProps() });
    expect(wrapper.text()).toContain("開始");
    expect(wrapper.text()).not.toContain("一時停止");
  });

  it("isRunning=true のとき一時停止ボタンを表示する", () => {
    const wrapper = mount(Controls, { props: makeProps({ isRunning: true }) });
    expect(wrapper.text()).toContain("一時停止");
    expect(wrapper.text()).not.toContain("開始");
  });

  it("開始ボタンクリックで onStart が呼ばれる", async () => {
    const onStart = vi.fn();
    const wrapper = mount(Controls, { props: makeProps({ onStart }) });
    await wrapper.find("button").trigger("click");
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("一時停止ボタンクリックで onPause が呼ばれる", async () => {
    const onPause = vi.fn();
    const wrapper = mount(Controls, { props: makeProps({ isRunning: true, onPause }) });
    await wrapper.find("button").trigger("click");
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("isRunning=true のとき「次の世代」ボタンが disabled になる", () => {
    const wrapper = mount(Controls, { props: makeProps({ isRunning: true }) });
    const stepBtn = wrapper.findAll("button").find((b) => b.text().includes("次の世代"))!;
    expect(stepBtn.element.disabled).toBe(true);
  });

  it("solved=true のとき「次の世代」ボタンが disabled になる", () => {
    const wrapper = mount(Controls, { props: makeProps({ solved: true }) });
    const stepBtn = wrapper.findAll("button").find((b) => b.text().includes("次の世代"))!;
    expect(stepBtn.element.disabled).toBe(true);
  });

  it("「次の世代」ボタンが enabled のとき onStepOnce が呼ばれる", async () => {
    const onStepOnce = vi.fn();
    const wrapper = mount(Controls, { props: makeProps({ onStepOnce }) });
    const stepBtn = wrapper.findAll("button").find((b) => b.text().includes("次の世代"))!;
    await stepBtn.trigger("click");
    expect(onStepOnce).toHaveBeenCalledOnce();
  });

  it("リセットボタンクリックで onReset が呼ばれる", async () => {
    const onReset = vi.fn();
    const wrapper = mount(Controls, { props: makeProps({ onReset }) });
    const resetBtn = wrapper.findAll("button").find((b) => b.text().includes("リセット"))!;
    await resetBtn.trigger("click");
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("開始ボタンが solved=true のとき disabled になる", () => {
    const wrapper = mount(Controls, { props: makeProps({ solved: true }) });
    const startBtn = wrapper.findAll("button").find((b) => b.text().includes("開始"))!;
    expect(startBtn.element.disabled).toBe(true);
  });

  it("現在の speed をテキスト表示する", () => {
    const wrapper = mount(Controls, { props: makeProps({ speed: 150 }) });
    expect(wrapper.text()).toContain("150ms/世代");
  });

  it("スライダーの value は SPEED_MIN + SPEED_MAX - speed（反転）", () => {
    const wrapper = mount(Controls, { props: makeProps({ speed: 200 }) });
    const expected = String(SPEED_MIN + SPEED_MAX - 200); // 900
    expect((wrapper.find("input[type=range]").element as HTMLInputElement).value).toBe(expected);
  });

  it("スライダー変更で onSpeedChange が反転値で呼ばれる", async () => {
    const onSpeedChange = vi.fn();
    const wrapper = mount(Controls, { props: makeProps({ onSpeedChange }) });
    await wrapper.find("input[type=range]").setValue("600");
    expect(onSpeedChange).toHaveBeenCalledWith(SPEED_MIN + SPEED_MAX - 600); // 500
  });
});
