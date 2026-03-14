import { defineComponent, computed, ref } from "vue";

import Controls from "./components/Controls";
import ConvergenceGraph from "./components/ConvergenceGraph";
import Header from "./components/Header";
import IndividualList from "./components/IndividualList";
import StatusBar from "./components/StatusBar";
import { calcFitness, encode, sanitize } from "./ga/core";
import { useSimulator } from "./hooks/useSimulator";

export default defineComponent({
  name: "App",
  setup() {
    const [state, actions] = useSimulator();
    const targetInput = ref(state.target);

    const sorted = computed(() =>
      [...state.population]
        .map((ind) => ({ ind, fit: calcFitness(ind, encode(state.target)) }))
        .sort((a, b) => b.fit - a.fit),
    );

    const lastHistory = computed(() => state.history[state.history.length - 1]);

    const handleSetTarget = () => {
      actions.applyTarget(targetInput.value);
      targetInput.value = sanitize(targetInput.value);
    };

    return () => (
      <div class="flex min-h-screen flex-col gap-3 bg-gray-900 p-3 font-mono text-white select-none">
        <Header
          targetInput={targetInput.value}
          isRunning={state.isRunning}
          onChange={(v: string) => (targetInput.value = v)}
          onSet={handleSetTarget}
        />
        <Controls
          isRunning={state.isRunning}
          solved={state.solved}
          speed={state.speed}
          selectionMethod={state.selectionMethod}
          onStart={actions.start}
          onPause={actions.pause}
          onStepOnce={actions.stepOnce}
          onReset={actions.reset}
          onSpeedChange={actions.setSpeed}
          onSelectionMethodChange={actions.setSelectionMethod}
        />
        <StatusBar
          generation={state.generation}
          bestFit={lastHistory.value.best}
          avgFit={lastHistory.value.avg}
          bestInd={sorted.value[0]?.ind ?? ""}
          target={state.target}
        />
        {state.solved && (
          <div class="rounded-lg border-2 border-green-500 bg-green-900/80 p-3 text-center text-lg font-bold text-green-300">
            🎉 解発見！ 第 {state.generation} 世代で収束しました！
          </div>
        )}
        <div class="grid flex-1 grid-cols-2 gap-3">
          <IndividualList sorted={sorted.value} target={state.target} />
          <ConvergenceGraph history={state.history} />
        </div>
      </div>
    );
  },
});
