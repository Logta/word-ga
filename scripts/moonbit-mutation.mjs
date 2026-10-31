// MoonBit 向けの簡易 mutation testing。
// MoonBit には mutation testing ツールが無いため、演算子・比較・定数・境界の置換を
// 1 つずつ適用して `moon test` を回し、テストが mutant を検出できるかを測る。
//
// 使い方: bun scripts/moonbit-mutation.mjs [--filter <file名の一部>] [--timeout <秒>]
// - moonbit/ を一時ディレクトリへ複製してから書き換えるので、作業ツリーは変更しない
// - 結果は標準出力と reports/moonbit-mutation.json に出す
// - 等価 mutant（挙動が変わらない置換）も生存として数えるため、100% にはならない
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC_DIR = join(ROOT, "moonbit");
// 遺伝的アルゴリズムの中核ロジック（テストファイルは対象外）
const TARGET_FILES = [
  "src/ga.mbt",
  "src/individual.mbt",
  "src/rng.mbt",
  "src/selection_elite.mbt",
  "src/selection_roulette.mbt",
];

const args = process.argv.slice(2);
const argValue = (name) => {
  const idx = args.indexOf(name);
  return idx === -1 ? undefined : args[idx + 1];
};
const filter = argValue("--filter");
const timeoutSec = Number(argValue("--timeout") ?? "60");

// 二項演算子（moon fmt 済みのコードは前後に空白が入る前提）
const BINARY_SWAPS = [
  [" <= ", [" < ", " > "]],
  [" >= ", [" > ", " < "]],
  [" < ", [" <= ", " >= "]],
  [" > ", [" >= ", " <= "]],
  [" == ", [" != "]],
  [" != ", [" == "]],
  [" && ", [" || "]],
  [" || ", [" && "]],
  [" += ", [" -= "]],
  [" -= ", [" += "]],
  [" + ", [" - "]],
  [" - ", [" + "]],
  [" * ", [" / "]],
  [" / ", [" * "]],
  [" % ", [" * "]],
  [" >> ", [" << "]],
  [" << ", [" >> "]],
  [" & ", [" | "]],
  [" | ", [" & "]],
  [" ^ ", [" | "]],
  ["..<", ["..="]],
];

// 文字列リテラルとコメントを空白で塗りつぶし、置換候補の位置判定に使う
function maskLine(line) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!inStr && ch === "/" && line[i + 1] === "/") {
      return out + " ".repeat(line.length - i);
    }
    if (ch === '"' && line[i - 1] !== "\\") {
      inStr = !inStr;
      out += " ";
      continue;
    }
    out += inStr ? " " : ch;
  }
  return out;
}

function* findAll(haystack, needle) {
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    yield idx;
    idx = haystack.indexOf(needle, idx + 1);
  }
}

function mutateNumber(lit) {
  const suffix = lit.endsWith("L") ? "L" : "";
  const body = suffix ? lit.slice(0, -1) : lit;
  if (body.startsWith("0x")) {
    // 16 進定数は 1 ビット落とした値にする
    return `0x${(BigInt(body) >> 1n).toString(16).toUpperCase()}${suffix}`;
  }
  if (body.includes(".")) {
    return Number(body) === 0 ? "1.0" : "0.0";
  }
  const n = BigInt(body);
  return `${n === 1n ? 0n : n + 1n}${suffix}`;
}

function generateMutants(file, source) {
  const lines = source.split("\n");
  const mutants = [];
  const push = (lineNo, col, from, to) => {
    const line = lines[lineNo];
    const mutated = line.slice(0, col) + to + line.slice(col + from.length);
    mutants.push({ file, line: lineNo + 1, from: from.trim(), to: to.trim(), mutated, lineNo });
  };
  lines.forEach((line, lineNo) => {
    const masked = maskLine(line);
    if (masked.trim() === "" || masked.trimStart().startsWith("test ")) return;
    const taken = new Set();
    for (const [op, reps] of BINARY_SWAPS) {
      for (const col of findAll(masked, op)) {
        // 長い演算子（<= など）の一部を短い演算子（<）として二重に数えない
        if ([...Array(op.length).keys()].some((k) => taken.has(col + k))) continue;
        for (let k = 0; k < op.length; k++) taken.add(col + k);
        for (const rep of reps) push(lineNo, col, op, rep);
      }
    }
    // 単項マイナス（-rot など）の除去
    for (const m of masked.matchAll(/(?<=[(\s])-(?=[a-z(])/g)) push(lineNo, m.index, "-", "");
    // 数値リテラル
    for (const m of masked.matchAll(/(?<![\w.'])(0x[0-9A-Fa-f]+L?|\d+\.\d+|\d+L?)(?![\w.'])/g)) {
      push(lineNo, m.index, m[0], mutateNumber(m[0]));
    }
    // 文字リテラル '0' / '1'
    for (const m of line.matchAll(/'([01])'/g)) {
      if (masked[m.index] !== "'") continue;
      push(lineNo, m.index, m[0], m[1] === "0" ? "'1'" : "'0'");
    }
    // break の除去
    for (const m of masked.matchAll(/\bbreak\b/g)) push(lineNo, m.index, "break", "()");
  });
  return mutants;
}

function runTests(cwd) {
  const res = spawnSync("moon", ["test", "--target", "wasm-gc"], {
    cwd,
    encoding: "utf8",
    timeout: timeoutSec * 1000,
  });
  if (res.error?.code === "ETIMEDOUT" || res.signal) return "timeout";
  const out = `${res.stdout}\n${res.stderr}`;
  if (res.status === 0) return "survived";
  if (/Total tests: \d+, passed: \d+, failed: [1-9]/.test(out)) {
    return "killed";
  }
  return "compile_error";
}

const work = mkdtempSync(join(tmpdir(), "moonbit-mutation-"));
const workDir = join(work, "moonbit");
cpSync(SRC_DIR, workDir, { recursive: true, filter: (p) => !p.includes("_build") });

try {
  if (runTests(workDir) !== "survived") {
    throw new Error("変異前のテストが通りません。先に `moon test` を通してください。");
  }
  const results = [];
  for (const rel of TARGET_FILES) {
    if (filter && !rel.includes(filter)) continue;
    const path = join(workDir, rel);
    const original = readFileSync(path, "utf8");
    const mutants = generateMutants(rel, original);
    for (const [i, m] of mutants.entries()) {
      const lines = original.split("\n");
      lines[m.lineNo] = m.mutated;
      writeFileSync(path, lines.join("\n"));
      const status = runTests(workDir);
      results.push({ file: m.file, line: m.line, from: m.from, to: m.to, status });
      process.stdout.write(
        `[${rel} ${i + 1}/${mutants.length}] ${status.padEnd(13)} L${m.line}: ${m.from} -> ${m.to}\n`,
      );
    }
    writeFileSync(path, original);
  }
  const count = (s) => results.filter((r) => r.status === s).length;
  const killed = count("killed") + count("timeout");
  const valid = killed + count("survived");
  const score = valid === 0 ? 0 : (killed / valid) * 100;
  console.log("\n=== MoonBit mutation testing ===");
  console.log(
    `killed: ${count("killed")}, timeout: ${count("timeout")}, survived: ${count("survived")}, compile_error: ${count("compile_error")}`,
  );
  console.log(`mutation score: ${score.toFixed(1)}% (${killed}/${valid})`);
  for (const r of results.filter((x) => x.status === "survived")) {
    console.log(`  survived ${r.file}:${r.line}  ${r.from} -> ${r.to}`);
  }
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(
    join(ROOT, "reports", "moonbit-mutation.json"),
    `${JSON.stringify({ score, results }, null, 2)}\n`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
