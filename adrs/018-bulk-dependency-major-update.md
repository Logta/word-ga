# ADR-018: 全npm依存のmajorを含む一括最新化

**Status**: Accepted

## Context

`bun outdated` により以下がmajor相当の更新対象と判明した（0.x系はminorでも破壊的変更を伴いうるため同列に扱う）。

| パッケージ | 現行 | 最新 |
|---|---|---|
| typescript | 5.9.3 | 7.0.2 |
| jsdom (dev) | 28.1.0 | 30.0.1 |
| oxfmt (dev) | 0.40.0 | 0.63.0 |
| oxlint (dev) | 1.55.0 | 1.78.0 |
| vite-plugin-moonbit (dev) | 0.1.5 | 0.5.1 |

その他（vue, vue-chartjs, @tailwindcss/postcss, @vitejs/plugin-vue(-jsx), @vitest/coverage-v8, @vue/test-utils, autoprefixer, postcss, tailwindcss, vite, vitest）はminor/patchのみ。

`bunfig.toml` の `minimumReleaseAge = 259200`（3日）はbunのインストール解決全体に適用される設定のため、`bun update --latest` を使っても自動的に守られる。

### 事前調査結果

- **vite-plugin-moonbit 0.5.1**: `root` / `watch` / `target` / `showLogs` / `useJsBuiltinString` は後方互換。`useJsBuiltinString` は明示指定を維持でき、未指定時は `moon.pkg` の `use-js-builtin-string` から自動検出されるようになった（本プロジェクトの `moonbit/src/moon.pkg` は既に `use-js-builtin-string: true` を宣言済みのため、明示指定を残しても矛盾しない）。破壊的変更なし
- **typescript 7.0.2**: `latest` dist-tag。TypeScriptのネイティブ（Go実装）系列。`tsc -b`（プロジェクト参照ビルド）のCLI互換性をビルド確認で担保する
- **jsdom 30.0.1**: vitestの `environment: "jsdom"` として利用のみ。テスト実行で担保する
- **oxfmt 0.63.0 / oxlint 1.78.0**: 新規デフォルトルール追加によるフォーマット差分・lint差分が出うる。lint/fmtの実行結果で担保する

## Decision

全依存を `bun update --latest`（`minimumReleaseAge` 適用済み）で一括更新する。ビルド・テスト・lintが通ることを確認し、通らない場合は個別に原因を切り分けて対処する。

## Consequences

`bun update --latest` 実行後、`minimumReleaseAge` が実際に適用されていることを resolve されたバージョンの公開日で個別検証した（実行日2026-08-13、ゲート=3日前=2026-08-10T11:33 UTC以前）。

| パッケージ | resolved | 公開日 | ゲート適用 |
|---|---|---|---|
| typescript | 7.0.2 | 2026-07-08 | ✅ 十分に古い |
| jsdom | 30.0.1 | 2026-07-29 | ✅ 十分に古い |
| oxfmt | 0.63.0 | 2026-08-10T10:51 | ✅ ギリギリ3日超 |
| oxlint | 1.78.0 | 2026-08-10T10:47 | ✅ ギリギリ3日超 |
| vite-plugin-moonbit | 0.5.1 | 2026-07-22 | ✅ 十分に古い |

`bun run build` / `bun run test` / `bun run lint` / `bun run fmt:check` は全て成功。ただし以下の破壊的変更に対応が必要だった。

### 対応した破壊的変更

**typescript 5.9→7.0**: 新しい診断 `TS2882`（副作用importにも型解決が必須になった）により `import "./index.css"` がエラーに。`src/env.d.ts` に `/// <reference types="vite/client" />` を追加して解消（Viteプロジェクトの標準的な型宣言で、元々抜けていた）。

**oxlint 1.55→1.78**: 新バージョンで以下が発生
- ルール `no-magic-numbers-in-enums` が廃止されたため `oxlint.json` から削除
- 新規デフォルトルール `one-var`（変数宣言の結合強制）が84箇所で発火。本プロジェクトは一貫して個別`const`宣言のスタイルを採用しており（既存の `sort-keys`/`id-length`/`no-ternary` 等の無効化方針と同様）、コードを書き換えるのではなくルールを無効化
- `unicorn/prefer-export-from` が `src/ga/core.ts` の re-export に見えるimportに対して誤検知（実際は内部関数からも使用されており単純な再エクスポートではない）。無効化
- `unicorn/no-array-sort`（`Array#sort()`は破壊的操作、`toSorted()`推奨）は `src/App.tsx` で妥当な指摘だったため `toSorted()` に修正（`tsconfig.json` の `lib` に `ES2023` を追加）
- `no-underscore-dangle` が `src/ga/wasmBridge.ts` のモジュール内部状態 `_exports` に発火。`wasmExports` にリネームして解消

**vite-plugin-moonbit 0.1→0.5**: `root` / `target` / `useJsBuiltinString` 等の既存オプションは後方互換。破壊的変更なし。新機能（`prefix`, `tsBridge`, `npmPackage`, `normalizedDts`）は本更新では利用しない（現状の単純な単一パッケージ構成では不要なため）
