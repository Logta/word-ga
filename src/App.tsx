import { defineComponent, computed, ref } from "vue";

import Controls from "./components/Controls";
import ConvergenceGraph from "./components/ConvergenceGraph";
import Header from "./components/Header";
import IndividualList from "./components/IndividualList";
import StatusBar from "./components/StatusBar";
import { sanitize } from "./ga/encoding";
import { useSimulator } from "./hooks/useSimulator";

export default defineComponent({
  name: "App",
  setup() {
    const [state, actions] = useSimulator();
    const targetInput = ref(state.target);

    // 適応度は SimState に保持済みのものを参照する（wasm 再計算なし、ADR-021）
    const sorted = computed(() =>
      state.population
        .map((ind, i) => ({ ind, fit: state.fits[i] }))
        .toSorted((a, b) => b.fit - a.fit),
    );

    // ベスト個体・ベスト適応度は同一の sorted から取り、表示の出所を一本化する
    const best = computed(() => sorted.value[0]);

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
          bestFit={best.value?.fit ?? 0}
          avgFit={lastHistory.value.avg}
          bestInd={best.value?.ind ?? ""}
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
