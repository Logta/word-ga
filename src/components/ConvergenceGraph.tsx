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
import type { HistoryEntry } from "../types";

interface ConvergenceGraphProps {
  history: HistoryEntry[];
}

const MAX_DISPLAY = 150;

export function ConvergenceGraph({ history }: ConvergenceGraphProps) {
  const data = history.slice(-MAX_DISPLAY).map((h) => ({
    gen: h.generation,
    best: +(h.best * 100).toFixed(1),
    avg: +(h.avg * 100).toFixed(1),
  }));

  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
      <h2 className="text-cyan-400 font-bold mb-2 text-sm">収束グラフ</h2>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 15, left: 0, bottom: 22 }}>
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
              formatter={(value) => (value === "best" ? "最高適応度" : "平均適応度")}
              wrapperStyle={{ fontSize: "11px", paddingBottom: "4px" }}
            />
            <Line
              type="monotone"
              dataKey="best"
              stroke="#22C55E"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              name="best"
            />
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
  );
}
