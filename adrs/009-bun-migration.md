# ADR-009: JS ベースを npm から Bun に移行

**Status**: Accepted

## Context

現在のプロジェクトは npm + node_modules 構成で、`package-lock.json` によりロック管理している。

- npm は `node_modules` のディスク使用量が大きく、`npm install` が低速
- Bun は npm の drop-in replacement であり、Node.js 互換性が高く、インストール・実行が大幅に高速
- Deno も代替候補として検討したが、以下の理由で不採用:
  - `vite-plugin-moonbit` は内部で Node.js の `child_process.spawn` / `child_process.unref()` / `fs` / `path` を直接使用している
  - Deno は `child_process.unref()` に既知の Issue があり、Vite 8 との公式サポートもない
  - Bun は Node.js API の >95% を互換サポートするため、vite-plugin-moonbit がノーコストで動作する

## Decision

パッケージマネージャ・ランタイムを npm から Bun に移行する。

- `package.json` / スクリプトはそのまま使用（変更不要）
- `package-lock.json` → `bun.lock`（テキスト形式、Git 管理可能）
- `npm install` → `bun install`、`npm run *` → `bun run *` に置き換え

### 移行手順

```bash
# 1. Bun インストール
curl -fsSL https://bun.sh/install | bash

# 2. 依存関係インストール（bun.lock が自動生成される）
bun install

# 3. 開発サーバー起動
bun run dev

# 4. ビルド
bun run build

# 5. テスト
bun run test
```

## Consequences

### メリット

- `bun install` は npm の約 20〜40 倍高速
- Node.js >95% 互換のため vite-plugin-moonbit（`child_process.spawn` / `fs` / `path`）がノーコストで動作
- `package.json` / Vite 8 / vitest / Tailwind v4 / recharts がすべてそのまま動作
- `bun.lock` はテキスト形式で Git での差分確認・マージが容易
- 将来的に `bun test` へ移行することでさらに高速なテスト実行も可能

### トレードオフ・課題（移行難度：LOW）

| 影響範囲 | 詳細 | 重要度 |
|---|---|---|
| lockfile | `package-lock.json` → `bun.lock` に切り替わる（初回 `bun install` で自動生成） | LOW |
| CI/CD | npm → bun に変更が必要（`setup-bun` action など） | LOW |
| vite-plugin-moonbit | Bun の Node.js 互換性により問題なく動作（検証推奨） | LOW |
| Rolldown (Vite 8) | Bun + Vite 8 は推奨の組み合わせ | 問題なし |

移行難度が LOW である理由：Bun は npm の drop-in replacement として設計されており、`package.json` のスクリプトやすべての依存パッケージをそのまま利用できる。Deno と異なり Node.js API の互換性が高く、`vite-plugin-moonbit` の内部実装（`child_process.unref()` を含む）も問題なく動作する。
