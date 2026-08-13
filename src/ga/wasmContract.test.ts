// 実Wasmアーティファクトとの言語間契約テスト。
// 他の全テストは wasmBridge をモックするため、MoonBit 側のドリフト
// （sep・選択戦略文字列・calc_fitness の意味論）はここでのみ検出できる。
// JS String Builtins を要するため Bun サブプロセス（プローブ）経由で実行する。
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect, beforeAll } from "vitest";

import { referenceFitness } from "../testUtils/referenceFitness";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "../..");
const moonbitDir = path.join(repoRoot, "moonbit");
const wasmPath = path.join(moonbitDir, "_build/wasm-gc/release/build/src/src.wasm");
const probePath = path.join(repoRoot, "scripts/wasm-contract-probe.mjs");

interface ProbeResult {
  fitnessSamples: { ind: string; target: string; fitness: number }[];
  evolvedElite: string;
  evolvedEliteAgain: string;
  evolvedRoulette: string;
  unknownStrategyTrapped: boolean;
}

let probe: ProbeResult;

const PROBE_TIMEOUT_MS = 120_000;

beforeAll(() => {
  if (!existsSync(wasmPath)) {
    execFileSync("moon", ["build", "--target", "wasm-gc", "--release"], { cwd: moonbitDir });
  }
  const stdout = execFileSync("bun", [probePath, wasmPath], { encoding: "utf8" });
  probe = JSON.parse(stdout) as ProbeResult;
}, PROBE_TIMEOUT_MS);

describe("wasm契約（実アーティファクト）", () => {
  it("calc_fitness が TS 参照実装と一致する", () => {
    expect(probe.fitnessSamples.length).toBeGreaterThan(0);
    for (const s of probe.fitnessSamples) {
      expect(s.fitness).toBeCloseTo(referenceFitness(s.ind, s.target), 10);
    }
  });

  it("evolve(elite) は '|' 区切りで個体数・個体長を保存しバイナリのみを返す", () => {
    const parts = probe.evolvedElite.split("|");
    expect(parts).toHaveLength(5);
    for (const ind of parts) {
      expect(ind).toMatch(/^[01]{5}$/);
    }
  });

  it("evolve(roulette) も同じ round-trip 契約を守る", () => {
    const parts = probe.evolvedRoulette.split("|");
    expect(parts).toHaveLength(5);
    for (const ind of parts) {
      expect(ind).toMatch(/^[01]{5}$/);
    }
  });

  it("同一シードで evolve は決定的", () => {
    expect(probe.evolvedEliteAgain).toBe(probe.evolvedElite);
  });

  it("未知の選択戦略は abort（トラップ）する (ADR-019)", () => {
    expect(probe.unknownStrategyTrapped).toBe(true);
  });
});
