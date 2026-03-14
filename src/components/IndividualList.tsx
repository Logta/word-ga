import { defineComponent, type PropType } from "vue";

import type { Individual } from "../types";
import GeneDisplay from "./GeneDisplay";

const ELITE_DISPLAY_COUNT = 3;
const FIT_HIGH = 0.8;
const FIT_MID = 0.5;
const PERCENT = 100;

function fitBarColor(fit: number, isElite: boolean): string {
  if (isElite) {
    return "bg-yellow-400";
  }
  if (fit >= FIT_HIGH) {
    return "bg-green-400";
  }
  if (fit >= FIT_MID) {
    return "bg-blue-400";
  }
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
      <div class="flex min-h-0 flex-col rounded-lg bg-gray-800 p-3">
        <h2 class="mb-2 text-sm font-bold text-cyan-400">
          個体リスト <span class="font-normal text-gray-500">（適応度降順）</span>
        </h2>
        <div class="flex-1 space-y-1 overflow-y-auto">
          {props.sorted.map(({ ind, fit }, idx) => {
            const isElite = idx < ELITE_DISPLAY_COUNT;
            return (
              <div
                key={idx}
                class={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                  isElite ? "border border-yellow-700/40 bg-yellow-900/50" : "bg-gray-700/40"
                }`}
              >
                <span
                  class={`w-5 shrink-0 text-right tabular-nums ${
                    isElite ? "text-yellow-400" : "text-gray-600"
                  }`}
                >
                  {idx + 1}
                </span>
                <span class={isElite ? "text-yellow-400" : "text-gray-700"}>
                  {isElite ? "★" : "·"}
                </span>
                <div class="mr-2 min-w-0 flex-1 truncate font-mono tracking-wider">
                  <GeneDisplay ind={ind} target={props.target} />
                </div>
                <div class="h-1.5 w-16 shrink-0 rounded-full bg-gray-600 sm:w-24">
                  <div
                    class={`h-1.5 rounded-full transition-all duration-150 ${fitBarColor(fit, isElite)}`}
                    style={{ width: `${fit * PERCENT}%` }}
                  />
                </div>
                <span
                  class={`w-9 shrink-0 text-right tabular-nums ${
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
