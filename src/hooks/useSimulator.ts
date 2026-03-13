import { useState, useRef, useEffect, useCallback } from "react";
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
  const [state, setState] = useState<SimState>(() => initState(DEFAULT_TARGET));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState((prev) => stepState(prev));
      }, state.speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.speed]);

  const start = useCallback(() => setState((p) => ({ ...p, isRunning: true })), []);
  const pause = useCallback(() => setState((p) => ({ ...p, isRunning: false })), []);
  const stepOnce = useCallback(() => setState((p) => stepState(p)), []);
  const reset = useCallback(() => setState((p) => initState(p.target, p.speed)), []);
  const setSpeed = useCallback(
    (speed: number) => setState((p) => ({ ...p, speed })),
    []
  );
  const applyTarget = useCallback((rawInput: string) => {
    const cleaned = sanitize(rawInput);
    if (!cleaned.trim()) return;
    setState((p) => initState(cleaned, p.speed));
  }, []);

  return [state, { start, pause, stepOnce, reset, setSpeed, applyTarget }];
}
