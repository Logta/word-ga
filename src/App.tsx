import { defineComponent, computed, ref } from "vue";
import { useSimulator } from "./hooks/useSimulator";
import { calcFitness, encode, sanitize } from "./ga/core";
import Header from "./components/Header";
import Controls from "./components/Controls";
import StatusBar from "./components/StatusBar";
import IndividualList from "./components/IndividualList";
import ConvergenceGraph from "./components/ConvergenceGraph";

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
      <div class="min-h-screen bg-gray-900 text-white font-mono flex flex-col p-3 gap-3 select-none">
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
          onStart={actions.start}
          onPause={actions.pause}
          onStepOnce={actions.stepOnce}
          onReset={actions.reset}
          onSpeedChange={actions.setSpeed}
        />
        <StatusBar
          generation={state.generation}
          bestFit={lastHistory.value.best}
          avgFit={lastHistory.value.avg}
          bestInd={sorted.value[0]?.ind ?? ""}
          target={state.target}
        />
        {state.solved && (
          <div class="p-3 bg-green-900/80 border-2 border-green-500 rounded-lg text-center text-green-300 font-bold text-lg">
            🎉 解発見！ 第 {state.generation} 世代で収束しました！
          </div>
        )}
        <div class="grid grid-cols-2 gap-3 flex-1">
          <IndividualList sorted={sorted.value} target={state.target} />
          <ConvergenceGraph history={state.history} />
        </div>
      </div>
    );
  },
});
