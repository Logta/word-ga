import { calcFitness } from "../ga/core";
import type { Individual } from "../types";

const ELITE_DISPLAY_COUNT = 3;

interface IndividualListProps {
  population: Individual[];
  target: string;
}

function renderGene(ind: Individual, target: string) {
  return ind.split("").map((ch, i) => (
    <span
      key={i}
      className={ch === target[i] ? "text-green-400 font-bold" : "text-red-400"}
    >
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));
}

function fitBarColor(fit: number, isElite: boolean): string {
  if (isElite) return "bg-yellow-400";
  if (fit >= 0.8) return "bg-green-400";
  if (fit >= 0.5) return "bg-blue-400";
  return "bg-gray-500";
}

export function IndividualList({ population, target }: IndividualListProps) {
  const sorted = [...population].sort(
    (a, b) => calcFitness(b, target) - calcFitness(a, target)
  );

  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
      <h2 className="text-cyan-400 font-bold mb-2 text-sm">
        個体リスト{" "}
        <span className="text-gray-500 font-normal">（適応度降順）</span>
      </h2>
      <div className="overflow-y-auto flex-1 space-y-1">
        {sorted.map((ind, idx) => {
          const fit = calcFitness(ind, target);
          const isElite = idx < ELITE_DISPLAY_COUNT;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                isElite
                  ? "bg-yellow-900/50 border border-yellow-700/40"
                  : "bg-gray-700/40"
              }`}
            >
              <span
                className={`w-5 text-right shrink-0 tabular-nums ${
                  isElite ? "text-yellow-400" : "text-gray-600"
                }`}
              >
                {idx + 1}
              </span>
              <span className={isElite ? "text-yellow-400" : "text-gray-700"}>
                {isElite ? "★" : "·"}
              </span>
              <span className="font-mono shrink-0 tracking-wider w-[7.5rem]">
                {renderGene(ind, target)}
              </span>
              <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-150 ${fitBarColor(fit, isElite)}`}
                  style={{ width: `${fit * 100}%` }}
                />
              </div>
              <span
                className={`w-9 text-right shrink-0 tabular-nums ${
                  isElite ? "text-yellow-300" : "text-gray-400"
                }`}
              >
                {(fit * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
