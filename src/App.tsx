import { useState } from "react";
import { useSimulator } from "./hooks/useSimulator";
import { calcFitness, POP_SIZE } from "./ga/core";
import { Header } from "./components/Header";
import { Controls } from "./components/Controls";
import { StatusBar } from "./components/StatusBar";
import { IndividualList } from "./components/IndividualList";
import { ConvergenceGraph } from "./components/ConvergenceGraph";

export default function App() {
  const [state, actions, wasmReady] = useSimulator();
  const [targetInput, setTargetInput] = useState(state.target);

  const { target, population, generation, history, isRunning, speed, solved } = state;

  const sortedPop = [...population].sort(
    (a, b) => calcFitness(b, target) - calcFitness(a, target)
  );
  const bestInd = sortedPop[0];
  const bestFit = calcFitness(bestInd, target);
  const avgFit = population.reduce((s, ind) => s + calcFitness(ind, target), 0) / POP_SIZE;

  const handleSetTarget = () => {
    actions.applyTarget(targetInput);
    setTargetInput((prev) =>
      prev.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 20)
    );
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
        wasmReady={wasmReady}
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
        bestInd={bestInd}
        target={target}
      />
      {solved && (
        <div className="p-3 bg-green-900/80 border-2 border-green-500 rounded-lg text-center text-green-300 font-bold text-lg">
          🎉 解発見！ 第 {generation} 世代で収束しました！
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <IndividualList population={population} target={target} />
        <ConvergenceGraph history={history} />
      </div>
    </div>
  );
}
