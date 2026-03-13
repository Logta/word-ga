import type { Individual } from "../types";
import { GeneDisplay } from "./GeneDisplay";

interface StatusBarProps {
  generation: number;
  bestFit: number;
  avgFit: number;
  bestInd: Individual;
  target: string;
}

export function StatusBar({ generation, bestFit, avgFit, bestInd, target }: StatusBarProps) {
  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-800 rounded-lg text-center">
      <div>
        <div className="text-gray-500 text-xs mb-0.5">世代</div>
        <div className="text-cyan-300 font-bold text-xl tabular-nums">{generation}</div>
      </div>
      <div>
        <div className="text-gray-500 text-xs mb-0.5">最高適応度</div>
        <div className="text-green-400 font-bold text-xl tabular-nums">
          {(bestFit * 100).toFixed(1)}%
        </div>
      </div>
      <div>
        <div className="text-gray-500 text-xs mb-0.5">平均適応度</div>
        <div className="text-yellow-400 font-bold text-xl tabular-nums">
          {(avgFit * 100).toFixed(1)}%
        </div>
      </div>
      <div>
        <div className="text-gray-500 text-xs mb-0.5">ベスト個体</div>
        <div className="font-bold tracking-widest text-sm">
          <GeneDisplay ind={bestInd} target={target} />
        </div>
      </div>
    </div>
  );
}
