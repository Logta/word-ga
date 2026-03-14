import { defineComponent, type PropType } from "vue";

import type { SelectionMethod } from "../types";

const SPEED_MIN = 100;
const SPEED_MAX = 1000;

export default defineComponent({
  name: "Controls",
  props: {
    isRunning: { type: Boolean, required: true as const },
    solved: { type: Boolean, required: true as const },
    speed: { type: Number, required: true as const },
    selectionMethod: { type: String as PropType<SelectionMethod>, required: true as const },
    onStart: { type: Function as PropType<() => void>, required: true as const },
    onPause: { type: Function as PropType<() => void>, required: true as const },
    onStepOnce: { type: Function as PropType<() => void>, required: true as const },
    onReset: { type: Function as PropType<() => void>, required: true as const },
    onSpeedChange: { type: Function as PropType<(speed: number) => void>, required: true as const },
    onSelectionMethodChange: {
      type: Function as PropType<(selectionMethod: SelectionMethod) => void>,
      required: true as const,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-gray-800 p-3">
        {!props.isRunning ? (
          <button
            onClick={props.onStart}
            disabled={props.solved}
            class="min-w-[90px] rounded bg-green-700 px-5 py-2 font-bold transition-colors hover:bg-green-600 disabled:opacity-40"
          >
            ▶ 開始
          </button>
        ) : (
          <button
            onClick={props.onPause}
            class="min-w-[90px] rounded bg-yellow-600 px-5 py-2 font-bold transition-colors hover:bg-yellow-500"
          >
            ⏸ 一時停止
          </button>
        )}
        <button
          onClick={props.onStepOnce}
          disabled={props.isRunning || props.solved}
          class="rounded bg-blue-700 px-4 py-2 transition-colors hover:bg-blue-600 disabled:opacity-40"
        >
          ⏭ 次の世代
        </button>
        <button
          onClick={props.onReset}
          class="rounded bg-gray-600 px-4 py-2 transition-colors hover:bg-gray-500"
        >
          ↺ リセット
        </button>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">選択:</span>
          <select
            value={props.selectionMethod}
            onChange={(e: Event) =>
              props.onSelectionMethodChange(
                (e.target as HTMLSelectElement).value as SelectionMethod,
              )
            }
            class="rounded bg-gray-700 px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="elite">エリート</option>
            <option value="roulette">ルーレット</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">遅い</span>
          <input
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={50}
            value={SPEED_MIN + SPEED_MAX - props.speed}
            onInput={(e: Event) =>
              props.onSpeedChange(
                SPEED_MIN + SPEED_MAX - Number((e.target as HTMLInputElement).value),
              )
            }
            class="w-32 accent-cyan-400"
          />
          <span class="text-xs text-gray-500">速い</span>
          <span class="w-20 text-right text-xs text-cyan-300">{props.speed}ms/世代</span>
        </div>
      </div>
    );
  },
});
