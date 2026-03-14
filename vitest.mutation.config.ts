// Stryker mutation testing 用の Vitest 設定
// vite-plugin-moonbit を除外することで moon build --watch を起動せず高速化する
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  plugins: [vue(), vueJsx()],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
