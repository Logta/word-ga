import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import moonbit from "vite-plugin-moonbit";

export default defineConfig({
  base: "/word-ga/",
  plugins: [
    vue(),
    vueJsx(),
    moonbit({
      target: "wasm-gc",
      root: "moonbit",
      useJsBuiltinString: true,
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/**/*.d.ts", "src/**/*.test.*"],
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) return "recharts";
          if (id.includes("node_modules/react")) return "react";
        },
      },
    },
  },
});
