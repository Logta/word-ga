import { h } from "vue";

export const Line = {
  name: "Line",
  props: ["data", "options"],
  render: () => h("canvas", { "data-testid": "chart-canvas" }),
};
