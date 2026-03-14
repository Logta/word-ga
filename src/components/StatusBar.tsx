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
      <div class="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-800 rounded-lg text-center">
        <div>
          <div class="text-gray-500 text-xs mb-0.5">世代</div>
          <div class="text-cyan-300 font-bold text-xl tabular-nums">{props.generation}</div>
        </div>
        <div>
          <div class="text-gray-500 text-xs mb-0.5">最高適応度</div>
          <div class="text-green-400 font-bold text-xl tabular-nums">
            {(props.bestFit * PERCENT).toFixed(1)}%
          </div>
        </div>
        <div>
          <div class="text-gray-500 text-xs mb-0.5">平均適応度</div>
          <div class="text-yellow-400 font-bold text-xl tabular-nums">
            {(props.avgFit * PERCENT).toFixed(1)}%
          </div>
        </div>
        <div>
          <div class="text-gray-500 text-xs mb-0.5">ベスト個体</div>
          <div class="font-bold tracking-widest text-sm truncate">
            <GeneDisplay ind={props.bestInd} target={props.target} />
          </div>
        </div>
      </div>
    );
  },
});
