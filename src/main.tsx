import { createApp } from "vue";

import "./index.css";
import App from "./App";
import { initWasm } from "./ga/wasmBridge";

initWasm()
  .then(() => {
    createApp(App).mount("#root");
  })
  .catch((error: unknown) => {
    // wasm-gc 非対応ブラウザや .wasm アセットの取得失敗で、無言の白画面のまま
    // 止まらないようにする (ADR-019 関連レビュー指摘)
    console.error("Failed to initialize Wasm:", error);
    const root = document.getElementById("root");
    if (root) {
      root.textContent =
        "アプリの初期化に失敗しました。お使いのブラウザが WasmGC / JS String Builtins に対応しているかご確認ください。";
    }
  });
