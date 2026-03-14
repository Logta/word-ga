import { defineComponent, type PropType } from "vue";
import type { Individual } from "../types";
import GeneDisplay from "./GeneDisplay";

const ELITE_DISPLAY_COUNT = 3;
const FIT_HIGH = 0.8;
const FIT_MID = 0.5;
const PERCENT = 100;

function fitBarColor(fit: number, isElite: boolean): string {
  if (isElite) { return "bg-yellow-400"; }
  if (fit >= FIT_HIGH) { return "bg-green-400"; }
  if (fit >= FIT_MID) { return "bg-blue-400"; }
  return "bg-gray-500";
}

export default defineComponent({
  name: "IndividualList",
  props: {
    sorted: {
      type: Array as PropType<{ ind: Individual; fit: number }[]>,
      required: true as const,
    },
    target: { type: String, required: true as const },
  },
  setup(props) {
    return () => (
      <div class="bg-gray-800 rounded-lg p-3 flex flex-col min-h-0">
        <h2 class="text-cyan-400 font-bold mb-2 text-sm">
          個体リスト <span class="text-gray-500 font-normal">（適応度降順）</span>
        </h2>
        <div class="overflow-y-auto flex-1 space-y-1">
          {props.sorted.map(({ ind, fit }, idx) => {
            const isElite = idx < ELITE_DISPLAY_COUNT;
            return (
              <div
                key={idx}
                class={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                  isElite ? "bg-yellow-900/50 border border-yellow-700/40" : "bg-gray-700/40"
                }`}
              >
                <span
                  class={`w-5 text-right shrink-0 tabular-nums ${
                    isElite ? "text-yellow-400" : "text-gray-600"
                  }`}
                >
                  {idx + 1}
                </span>
                <span class={isElite ? "text-yellow-400" : "text-gray-700"}>
                  {isElite ? "★" : "·"}
                </span>
                <div class="font-mono tracking-wider flex-1 min-w-0 truncate mr-2">
                  <GeneDisplay ind={ind} target={props.target} />
                </div>
                <div class="w-16 sm:w-24 bg-gray-600 rounded-full h-1.5 shrink-0">
                  <div
                    class={`h-1.5 rounded-full transition-all duration-150 ${fitBarColor(fit, isElite)}`}
                    style={{ width: `${fit * PERCENT}%` }}
                  />
                </div>
                <span
                  class={`w-9 text-right shrink-0 tabular-nums ${
                    isElite ? "text-yellow-300" : "text-gray-400"
                  }`}
                >
                  {(fit * PERCENT).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});
