import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { defineComponent, computed, type PropType } from "vue";
import { Line } from "vue-chartjs";

import type { HistoryEntry } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MAX_DISPLAY = 150;
const PERCENT = 100;
const DASH_PATTERN = [5, 5]; // eslint-disable-line no-magic-numbers

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  scales: {
    x: {
      ticks: { color: "#9CA3AF", font: { size: 10 } },
      grid: { color: "#374151" },
      title: { display: true, text: "世代", color: "#6B7280", font: { size: 11 } },
    },
    y: {
      min: 0,
      max: 100,
      ticks: { color: "#9CA3AF", font: { size: 10 }, callback: (v) => `${v}%` },
      grid: { color: "#374151" },
    },
  },
  plugins: {
    legend: { labels: { color: "#9CA3AF", font: { size: 11 } } },
    tooltip: {
      backgroundColor: "#1F2937",
      borderColor: "#374151",
      borderWidth: 1,
      titleColor: "#9CA3AF",
      bodyColor: "#E5E7EB",
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed?.y ?? 0).toFixed(1)}%`,
        title: (items) => `第 ${items[0]?.label} 世代`,
      },
    },
  },
};

export default defineComponent({
  name: "ConvergenceGraph",
  components: { Line },
  props: { history: { type: Array as PropType<HistoryEntry[]>, required: true as const } },
  setup(props) {
    const chartData = computed(() => {
      const recent = props.history.slice(-MAX_DISPLAY);
      return {
        labels: recent.map((h) => String(h.generation)),
        datasets: [
          {
            label: "最高適応度",
            data: recent.map((h) => Number((h.best * PERCENT).toFixed(1))),
            borderColor: "#22C55E",
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0,
          },
          {
            label: "平均適応度",
            data: recent.map((h) => Number((h.avg * PERCENT).toFixed(1))),
            borderColor: "#FBBF24",
            borderWidth: 1.5,
            borderDash: DASH_PATTERN,
            pointRadius: 0,
            tension: 0,
          },
        ],
      };
    });

    return () => (
      <div class="flex min-h-0 flex-col rounded-lg bg-gray-800 p-3">
        <h2 class="mb-2 text-sm font-bold text-cyan-400">収束グラフ</h2>
        <div class="min-h-0 flex-1" style={{ minHeight: "200px" }}>
          <Line data={chartData.value} options={chartOptions} />
        </div>
      </div>
    );
  },
});
