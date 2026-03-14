import { createApp } from "vue";
import "./index.css";
import App from "./App";
import { initWasm } from "./ga/wasmBridge";

initWasm().then(() => {
  createApp(App).mount("#root");
});
