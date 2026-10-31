// TS 側の中核ロジックに対する mutation testing（Stryker）。
// 実行: mise run test:mutation（Node で動かす。Bun ランタイムでは vitest-runner の読み込みに失敗する）
// レポート: reports/mutation/mutation.html
/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  vitest: { configFile: "vite.config.ts" },
  mutate: [
    "src/ga/encoding.ts",
    "src/ga/diversity.ts",
    "src/ga/simulation.ts",
    "src/ga/wasmBridge.ts",
    "src/hooks/useSimulator.ts",
    "src/utils/format.ts",
  ],
  coverageAnalysis: "perTest",
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  thresholds: { high: 90, low: 75, break: null },
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
  // TypeScript 7（ネイティブ版）は Stryker が tsconfig の extends/references 書き換えに使う
  // JS API（ts.parseConfigFileTextToJson）を持たない。この tsconfig は extends/references を
  // 使っていないため書き換え自体が不要で、存在しないパスを指定してその処理を飛ばす。
  tsconfigFile: "",
};
