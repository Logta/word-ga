import type { Individual } from "../types";
import { GeneDisplay } from "./GeneDisplay";

const ELITE_DISPLAY_COUNT = 3;

interface IndividualListProps {
  sorted: { ind: Individual; fit: number }[];
  target: string;
}

function fitBarColor(fit: number, isElite: boolean): string {
  if (isElite) return "bg-yellow-400";
  if (fit >= 0.8) return "bg-green-400";
  if (fit >= 0.5) return "bg-blue-400";
  return "bg-gray-500";
}

export function IndividualList({ sorted, target }: IndividualListProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
      <h2 className="text-cyan-400 font-bold mb-2 text-sm">
        個体リスト{" "}
        <span className="text-gray-500 font-normal">（適応度降順）</span>
      </h2>
      <div className="overflow-y-auto flex-1 space-y-1">
        {sorted.map(({ ind, fit }, idx) => {
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
              <div className="font-mono tracking-wider flex-1 min-w-0 truncate mr-2">
                <GeneDisplay ind={ind} target={target} />
              </div>
              <div className="w-16 sm:w-24 bg-gray-600 rounded-full h-1.5 shrink-0">
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
