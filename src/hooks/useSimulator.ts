import { reactive, watch, onUnmounted } from "vue";

import { sanitize } from "../ga/encoding";
import { initState, stepState } from "../ga/simulation";
import type { SelectionMethod, SimState } from "../types";

const DEFAULT_TARGET = "HELLO WORLD";

export interface SimulatorActions {
  start: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  applyTarget: (rawInput: string) => void;
  setSelectionMethod: (selectionMethod: SelectionMethod) => void;
}

// 1世代分進めて state に反映する（インターバルtickと stepOnce の共通処理）
function applyStep(state: SimState): void {
  Object.assign(state, stepState({ ...state }));
}

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
        intervalId = setInterval(() => applyStep(state), speed);
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
  const stepOnce = () => applyStep(state);
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
    state as SimState,
    { start, pause, stepOnce, reset, setSpeed, applyTarget, setSelectionMethod },
  ];
}
