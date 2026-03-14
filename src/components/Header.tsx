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
        <h1 class="text-2xl font-bold text-cyan-400 tracking-wide">
          遺伝的アルゴリズム シミュレーター
        </h1>
        <div class="flex items-center gap-2">
          <span class="text-gray-400 text-sm">ターゲット:</span>
          <input
            type="text"
            value={props.targetInput}
            onInput={(e) => props.onChange(sanitize((e.target as HTMLInputElement).value))}
            onKeydown={(e: KeyboardEvent) => e.key === "Enter" && !props.isRunning && props.onSet()}
            disabled={props.isRunning}
            maxlength={20}
            class="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-cyan-300 w-56 text-sm
                   tracking-widest disabled:opacity-50 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            onClick={props.onSet}
            disabled={props.isRunning}
            class="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-sm disabled:opacity-50 transition-colors"
          >
            セット
          </button>
        </div>
      </div>
    );
  },
});
