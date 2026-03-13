/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import moonbit from "vite-plugin-moonbit";

export default defineConfig({
  plugins: [
    react(),
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
