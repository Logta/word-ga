import { defineComponent, type PropType } from "vue";

import { sanitize } from "../ga/core";

export default defineComponent({
  name: "Header",
  props: {
    targetInput: { type: String, required: true as const },
    isRunning: { type: Boolean, required: true as const },
    onChange: { type: Function as PropType<(value: string) => void>, required: true as const },
    onSet: { type: Function as PropType<() => void>, required: true as const },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center gap-1">
        <h1 class="text-2xl font-bold tracking-wide text-cyan-400">
          遺伝的アルゴリズム シミュレーター
        </h1>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">ターゲット:</span>
          <input
            type="text"
            value={props.targetInput}
            onInput={(e) => props.onChange(sanitize((e.target as HTMLInputElement).value))}
            onKeydown={(e: KeyboardEvent) => e.key === "Enter" && !props.isRunning && props.onSet()}
            disabled={props.isRunning}
            maxlength={20}
            class="w-56 rounded border border-gray-600 bg-gray-800 px-3 py-1 text-sm tracking-widest text-cyan-300 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={props.onSet}
            disabled={props.isRunning}
            class="rounded bg-cyan-700 px-3 py-1 text-sm transition-colors hover:bg-cyan-600 disabled:opacity-50"
          >
            セット
          </button>
        </div>
      </div>
    );
  },
});
