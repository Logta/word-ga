import { defineComponent } from "vue";

import GeneDisplay from "./GeneDisplay";

const PERCENT = 100;

export default defineComponent({
  name: "StatusBar",
  props: {
    generation: { type: Number, required: true as const },
    bestFit: { type: Number, required: true as const },
    avgFit: { type: Number, required: true as const },
    bestInd: { type: String, required: true as const },
    target: { type: String, required: true as const },
  },
  setup(props) {
    return () => (
      <div class="grid grid-cols-4 gap-2 rounded-lg bg-gray-800 px-3 py-2 text-center">
        <div>
          <div class="mb-0.5 text-xs text-gray-500">世代</div>
          <div class="text-xl font-bold text-cyan-300 tabular-nums">{props.generation}</div>
        </div>
        <div>
          <div class="mb-0.5 text-xs text-gray-500">最高適応度</div>
          <div class="text-xl font-bold text-green-400 tabular-nums">
            {(props.bestFit * PERCENT).toFixed(1)}%
          </div>
        </div>
        <div>
          <div class="mb-0.5 text-xs text-gray-500">平均適応度</div>
          <div class="text-xl font-bold text-yellow-400 tabular-nums">
            {(props.avgFit * PERCENT).toFixed(1)}%
          </div>
        </div>
        <div>
          <div class="mb-0.5 text-xs text-gray-500">ベスト個体</div>
          <div class="truncate text-sm font-bold tracking-widest">
            <GeneDisplay ind={props.bestInd} target={props.target} />
          </div>
        </div>
      </div>
    );
  },
});
