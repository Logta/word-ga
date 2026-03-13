import { useState, useMemo } from "react";
import { useSimulator } from "./hooks/useSimulator";
import { calcFitness, sanitize } from "./ga/core";
import { Header } from "./components/Header";
import { Controls } from "./components/Controls";
import { StatusBar } from "./components/StatusBar";
import { IndividualList } from "./components/IndividualList";
import { ConvergenceGraph } from "./components/ConvergenceGraph";

export default function App() {
  const [state, actions] = useSimulator();
  const [targetInput, setTargetInput] = useState(state.target);

  const { target, population, generation, history, isRunning, speed, solved } = state;

  const sorted = useMemo(
    () =>
      [...population]
        .map((ind) => ({ ind, fit: calcFitness(ind, target) }))
        .sort((a, b) => b.fit - a.fit),
    [population, target]
  );

  const { best: bestFit, avg: avgFit } = history[history.length - 1];

  const handleSetTarget = () => {
    actions.applyTarget(targetInput);
    setTargetInput(sanitize(targetInput));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono flex flex-col p-3 gap-3 select-none">
      <Header
        targetInput={targetInput}
        isRunning={isRunning}
        onChange={setTargetInput}
        onSet={handleSetTarget}
      />
      <Controls
        isRunning={isRunning}
        solved={solved}
        speed={speed}
        onStart={actions.start}
        onPause={actions.pause}
        onStepOnce={actions.stepOnce}
        onReset={actions.reset}
        onSpeedChange={actions.setSpeed}
      />
      <StatusBar
        generation={generation}
        bestFit={bestFit}
        avgFit={avgFit}
        bestInd={sorted[0]?.ind ?? ""}
        target={target}
      />
      {solved && (
        <div className="p-3 bg-green-900/80 border-2 border-green-500 rounded-lg text-center text-green-300 font-bold text-lg">
          🎉 解発見！ 第 {generation} 世代で収束しました！
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <IndividualList sorted={sorted} target={target} />
        <ConvergenceGraph history={history} />
      </div>
    </div>
  );
}
