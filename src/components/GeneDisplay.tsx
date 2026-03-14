import { defineComponent } from "vue";
import { decode } from "../ga/core";

export default defineComponent({
  name: "GeneDisplay",
  props: {
    ind: { type: String, required: true as const },
    target: { type: String, required: true as const },
  },
  setup(props) {
    return () =>
      decode(props.ind)
        .split("")
        .map((ch, i) => (
          <span
            key={i}
            class={ch === props.target[i] ? "text-green-400 font-bold" : "text-red-400"}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ));
  },
});
