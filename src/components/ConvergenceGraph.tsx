import { defineComponent, computed, type PropType } from "vue";
import { Line } from "vue-chartjs";
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
import type { HistoryEntry } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MAX_DISPLAY = 150;

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
      ticks: {
        color: "#9CA3AF",
        font: { size: 10 },
        callback: (v) => `${v}%`,
      },
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
  props: {
    history: { type: Array as PropType<HistoryEntry[]>, required: true as const },
  },
  setup(props) {
    const chartData = computed(() => {
      const recent = props.history.slice(-MAX_DISPLAY);
      return {
        labels: recent.map((h) => String(h.generation)),
        datasets: [
          {
            label: "最高適応度",
            data: recent.map((h) => +(h.best * 100).toFixed(1)),
            borderColor: "#22C55E",
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0,
          },
          {
            label: "平均適応度",
            data: recent.map((h) => +(h.avg * 100).toFixed(1)),
            borderColor: "#FBBF24",
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0,
          },
        ],
      };
    });

    return () => (
      <div class="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
        <h2 class="text-cyan-400 font-bold mb-2 text-sm">収束グラフ</h2>
        <div class="flex-1 min-h-0" style={{ minHeight: "200px" }}>
          <Line data={chartData.value} options={chartOptions} />
        </div>
      </div>
    );
  },
});
