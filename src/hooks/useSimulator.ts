import { reactive, watch, onUnmounted } from "vue";
import type { SimState } from "../types";
import { initState, stepState, sanitize } from "../ga/core";

const DEFAULT_TARGET = "HELLO WORLD";

export interface SimulatorActions {
  start: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  applyTarget: (rawInput: string) => void;
}

export function useSimulator(): [SimState, SimulatorActions] {
  const state = reactive<SimState>(initState(DEFAULT_TARGET));
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const clearTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
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
    Object.assign(state, initState(state.target, state.speed));
  };
  const setSpeed = (speed: number) => {
    state.speed = speed;
  };
  const applyTarget = (rawInput: string) => {
    const cleaned = sanitize(rawInput);
    if (!cleaned.trim()) return;
    Object.assign(state, initState(cleaned, state.speed));
  };

  return [state as unknown as SimState, { start, pause, stepOnce, reset, setSpeed, applyTarget }];
}
