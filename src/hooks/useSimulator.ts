import { reactive, watch, onUnmounted } from "vue";

import { initState, stepState, sanitize } from "../ga/core";
import type { SelectionMethod, SimState } from "../types";

const DEFAULT_TARGET = "HELLO WORLD";

export type SimulatorActions = {
  start: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  applyTarget: (rawInput: string) => void;
  setSelectionMethod: (selectionMethod: SelectionMethod) => void;
};

export function useSimulator(): [SimState, SimulatorActions] {
  const state = reactive<SimState>(initState(DEFAULT_TARGET));
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const clearTimer = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  // flush: "sync" で依存変化と同期的に実行（React の useEffect に相当）
  watch(
    () => [state.isRunning, state.speed] as const,
    ([isRunning, speed]) => {
      clearTimer();
      if (isRunning) {
        intervalId = setInterval(() => {
          Object.assign(state, stepState({ ...state } as SimState));
        }, speed);
      }
    },
    { flush: "sync" },
  );

  onUnmounted(() => clearTimer());

  const start = () => {
    state.isRunning = true;
  };
  const pause = () => {
    state.isRunning = false;
  };
  const stepOnce = () => {
    Object.assign(state, stepState({ ...state } as SimState));
  };
  const reset = () => {
    Object.assign(state, initState(state.target, state.speed, state.selectionMethod));
  };
  const setSpeed = (speed: number) => {
    state.speed = speed;
  };
  const applyTarget = (rawInput: string) => {
    const cleaned = sanitize(rawInput);
    if (!cleaned.trim()) {
      return;
    }
    Object.assign(state, initState(cleaned, state.speed, state.selectionMethod));
  };
  const setSelectionMethod = (selectionMethod: SelectionMethod) => {
    state.selectionMethod = selectionMethod;
  };

  return [
    state as unknown as SimState,
    { start, pause, stepOnce, reset, setSpeed, applyTarget, setSelectionMethod },
  ];
}
