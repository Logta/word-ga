import { useState, useRef, useCallback, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── 定数 ───────────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
const POP_SIZE = 30;
const MUTATION_RATE = 0.03;
const ELITE_RATIO = 0.4;
const ELITE_DISPLAY_COUNT = 3;
const DEFAULT_TARGET = "HELLO WORLD";

// ─── 型定義 ─────────────────────────────────────────────────
type Individual = string;

interface HistoryEntry {
  generation: number;
  best: number;
  avg: number;
}

interface SimState {
  target: string;
  population: Individual[];
  generation: number;
  history: HistoryEntry[];
  isRunning: boolean;
  speed: number;
  solved: boolean;
}

// ─── GAコアロジック ──────────────────────────────────────────
function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function randomIndividual(len: number): Individual {
  return Array.from({ length: len }, randomChar).join("");
}

function calcFitness(ind: Individual, target: string): number {
  let matches = 0;
  for (let i = 0; i < target.length; i++) {
    if (ind[i] === target[i]) matches++;
  }
  return matches / target.length;
}

function crossover(p1: Individual, p2: Individual): Individual {
  const pt = Math.floor(Math.random() * p1.length);
  return p1.slice(0, pt) + p2.slice(pt);
}

function mutate(ind: Individual): Individual {
  return ind
    .split("")
    .map((ch) => (Math.random() < MUTATION_RATE ? randomChar() : ch))
    .join("");
}

function evolve(pop: Individual[], target: string): Individual[] {
  const sorted = [...pop].sort(
    (a, b) => calcFitness(b, target) - calcFitness(a, target)
  );
  const eliteCount = Math.max(2, Math.floor(POP_SIZE * ELITE_RATIO));
  const elites = sorted.slice(0, eliteCount);
  return Array.from({ length: POP_SIZE }, () => {
    const p1 = elites[Math.floor(Math.random() * elites.length)];
    const p2 = elites[Math.floor(Math.random() * elites.length)];
    return mutate(crossover(p1, p2));
  });
}

function initState(target: string, prevSpeed = 300): SimState {
  const population = Array.from({ length: POP_SIZE }, () =>
    randomIndividual(target.length)
  );
  const fits = population.map((ind) => calcFitness(ind, target));
  const best = Math.max(...fits);
  const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
  return {
    target,
    population,
    generation: 0,
    history: [{ generation: 0, best, avg }],
    isRunning: false,
    speed: prevSpeed,
    solved: false,
  };
}

// ─── メインコンポーネント ────────────────────────────────────
export default function GeneticAlgorithmSim() {
  const [state, setState] = useState<SimState>(() => initState(DEFAULT_TARGET));
  const [targetInput, setTargetInput] = useState(DEFAULT_TARGET);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1世代進める（純粋な状態変換）
  const step = useCallback((prev: SimState): SimState => {
    if (prev.solved) return { ...prev, isRunning: false };
    const newPop = evolve(prev.population, prev.target);
    const fits = newPop.map((ind) => calcFitness(ind, prev.target));
    const best = Math.max(...fits);
    const avg = fits.reduce((a, b) => a + b, 0) / POP_SIZE;
    const generation = prev.generation + 1;
    const solved = best >= 1.0;
    return {
      ...prev,
      population: newPop,
      generation,
      history: [...prev.history, { generation, best, avg }],
      isRunning: solved ? false : prev.isRunning,
      solved,
    };
  }, []);

  // 自動実行インターバル管理
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState((prev) => step(prev));
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
  }, [state.isRunning, state.speed, step]);

  // ── ハンドラ ──
  const handleStart = () =>
    setState((p) => ({ ...p, isRunning: true }));
  const handlePause = () =>
    setState((p) => ({ ...p, isRunning: false }));
  const handleStepOnce = () =>
    setState((p) => step(p));
  const handleReset = () =>
    setState((p) => initState(p.target, p.speed));
  const handleSetTarget = () => {
    const cleaned = targetInput
      .toUpperCase()
      .replace(/[^A-Z ]/g, "")
      .slice(0, 20);
    if (!cleaned.trim()) return;
    setTargetInput(cleaned);
    setState((p) => initState(cleaned, p.speed));
  };

  // ── 表示用データ ──
  const { target, population, generation, history, isRunning, speed, solved } =
    state;

  const sortedPop = [...population].sort(
    (a, b) => calcFitness(b, target) - calcFitness(a, target)
  );
  const bestInd = sortedPop[0];
  const bestFit = calcFitness(bestInd, target);
  const avgFit =
    population.reduce((s, ind) => s + calcFitness(ind, target), 0) / POP_SIZE;

  // グラフデータ（最新150世代）
  const graphData = history.slice(-150).map((h) => ({
    gen: h.generation,
    best: +(h.best * 100).toFixed(1),
    avg: +(h.avg * 100).toFixed(1),
  }));

  // 遺伝子文字列のハイライト描画
  const renderGene = (ind: Individual) =>
    ind.split("").map((ch, i) => (
      <span
        key={i}
        className={
          ch === target[i]
            ? "text-green-400 font-bold"
            : "text-red-400"
        }
      >
        {ch === " " ? "\u00A0" : ch}
      </span>
    ));

  // 適応度バーの色
  const fitBarColor = (fit: number, isElite: boolean) => {
    if (isElite) return "bg-yellow-400";
    if (fit >= 0.8) return "bg-green-400";
    if (fit >= 0.5) return "bg-blue-400";
    return "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono flex flex-col p-3 gap-3 select-none">
      {/* ヘッダー */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-2xl font-bold text-cyan-400 tracking-wide">
          遺伝的アルゴリズム シミュレーター
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">ターゲット:</span>
          <input
            type="text"
            value={targetInput}
            onChange={(e) =>
              setTargetInput(
                e.target.value.toUpperCase().replace(/[^A-Z ]/g, "")
              )
            }
            onKeyDown={(e) =>
              e.key === "Enter" && !isRunning && handleSetTarget()
            }
            disabled={isRunning}
            maxLength={20}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-cyan-300 w-56 text-sm tracking-widest
                       disabled:opacity-50 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            onClick={handleSetTarget}
            disabled={isRunning}
            className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-sm disabled:opacity-50 transition-colors"
          >
            セット
          </button>
        </div>
      </div>

      {/* コントロールパネル */}
      <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-gray-800 rounded-lg">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={solved}
            className="px-5 py-2 bg-green-700 hover:bg-green-600 rounded font-bold
                       disabled:opacity-40 transition-colors min-w-[90px]"
          >
            ▶ 開始
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold
                       transition-colors min-w-[90px]"
          >
            ⏸ 一時停止
          </button>
        )}
        <button
          onClick={handleStepOnce}
          disabled={isRunning || solved}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded
                     disabled:opacity-40 transition-colors"
        >
          ⏭ 次の世代
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
        >
          ↺ リセット
        </button>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">遅い</span>
          <input
            type="range"
            min={100}
            max={1000}
            step={50}
            value={1100 - speed}
            onChange={(e) =>
              setState((p) => ({ ...p, speed: 1100 - Number(e.target.value) }))
            }
            className="w-32 accent-cyan-400"
          />
          <span className="text-gray-500 text-xs">速い</span>
          <span className="text-cyan-300 text-xs w-20 text-right">
            {speed}ms/世代
          </span>
        </div>
      </div>

      {/* ステータスバー */}
      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-800 rounded-lg text-center">
        <div>
          <div className="text-gray-500 text-xs mb-0.5">世代</div>
          <div className="text-cyan-300 font-bold text-xl tabular-nums">
            {generation}
          </div>
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
          <div className="font-bold tracking-widest text-sm truncate">
            {renderGene(bestInd)}
          </div>
        </div>
      </div>

      {/* 解発見バナー */}
      {solved && (
        <div className="p-3 bg-green-900/80 border-2 border-green-500 rounded-lg text-center
                        text-green-300 font-bold text-lg">
          🎉 解発見！ 第 {generation} 世代で収束しました！
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* 個体リスト */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
          <h2 className="text-cyan-400 font-bold mb-2 text-sm">
            個体リスト{" "}
            <span className="text-gray-500 font-normal">（適応度降順）</span>
          </h2>
          <div className="overflow-y-auto flex-1 space-y-1">
            {sortedPop.map((ind, idx) => {
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
                  {/* ランク */}
                  <span
                    className={`w-5 text-right shrink-0 tabular-nums ${
                      isElite ? "text-yellow-400" : "text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {/* エリートマーク */}
                  <span className={isElite ? "text-yellow-400" : "text-gray-700"}>
                    {isElite ? "★" : "·"}
                  </span>
                  {/* 遺伝子文字列 */}
                  <div className="font-mono tracking-wider flex-1 min-w-0 truncate mr-2">
                    {renderGene(ind)}
                  </div>
                  {/* 適応度バー */}
                  <div className="w-16 sm:w-24 bg-gray-600 rounded-full h-1.5 shrink-0">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-150 ${fitBarColor(fit, isElite)}`}
                      style={{ width: `${fit * 100}%` }}
                    />
                  </div>
                  {/* 適応度数値 */}
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

        {/* 収束グラフ */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
          <h2 className="text-cyan-400 font-bold mb-2 text-sm">収束グラフ</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={graphData}
                margin={{ top: 5, right: 15, left: 0, bottom: 22 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="gen"
                  stroke="#4B5563"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  label={{
                    value: "世代",
                    position: "insideBottom",
                    offset: -12,
                    fill: "#6B7280",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#4B5563"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  tickFormatter={(v) => `${v}%`}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === "best" ? "最高適応度" : "平均適応度",
                  ]}
                  labelFormatter={(label) => `第 ${label} 世代`}
                />
                <Legend
                  verticalAlign="top"
                  formatter={(value) =>
                    value === "best" ? "最高適応度" : "平均適応度"
                  }
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "4px" }}
                />
                {/* 最高適応度 */}
                <Line
                  type="monotone"
                  dataKey="best"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  name="best"
                />
                {/* 平均適応度 */}
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#FBBF24"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                  name="avg"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
