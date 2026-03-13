# ADR-012: CI ワークフローの整備

**Status**: Accepted

## Context

ADR-011 で GitHub Pages への CD（継続的デプロイ）を整備したが、
CI（継続的インテグレーション）が未整備のため、`main` へのプッシュや PR で品質チェックが自動実行されない。

以下のチェックを自動化する必要がある。

| チェック項目 | コマンド |
|---|---|
| MoonBit フォーマット | `moon fmt --check` |
| MoonBit テスト | `moon test --target wasm-gc` |
| TypeScript lint | `oxlint src/`（react / typescript プラグイン）|
| TypeScript 型チェック | `tsc -b --noEmit` |
| TypeScript テスト | `vitest --run` |
| ビルド検証 | `bun run build` |

## Decision

`.github/workflows/ci.yml` を作成し、`main` への push および PR をトリガーに CI を実行する。

### ジョブ構成

```
test-moonbit  ─┐
               ├→ build
test-ts       ─┘
```

| ジョブ | 内容 |
|---|---|
| `test-moonbit` | MoonBit テスト（wasm-gc ターゲット）|
| `test-ts` | TypeScript 型チェック + vitest |
| `build` | test-moonbit / test-ts が通った後にフルビルドを検証 |

テストとビルドを分離することで、テスト失敗時にビルドを実行しない。

### トリガー

- `push` to `main`
- `pull_request` to `main`

## Consequences

### メリット
- PR マージ前に MoonBit・TypeScript 双方のテストが自動実行される
- 型エラーやビルド失敗を早期に検出できる
- Bun を CI でも使用（ADR-009 と一貫）

### トレードオフ
- MoonBit のインストールを `test-moonbit` と `test-ts`（Wasm ビルドに必要）と `build` の3ジョブで重複実行する
- 各ジョブが独立して動くため、MoonBit インストール時間が並列分だけかかる（キャッシュで改善可能）
