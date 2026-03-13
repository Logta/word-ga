# ADR-011: GitHub Pages への CI/CD デプロイ

**Status**: Accepted

## Context

現在はローカルで `bun run build` を実行するだけで、デプロイの仕組みがない。
`main` ブランチへのプッシュ時に自動でビルド・デプロイされる仕組みを整備する。

デプロイ先として以下を検討した。

| 候補 | 費用 | 設定コスト | 備考 |
|---|---|---|---|
| **GitHub Pages** | 無料 | 低 | リポジトリに同梱、公式 Actions が充実 |
| Vercel | 無料枠あり | 低 | 外部サービス依存 |
| Cloudflare Pages | 無料枠あり | 低 | 外部サービス依存 |

外部サービス不要で管理が最もシンプルな **GitHub Pages** を採用する。

## Decision

GitHub Actions で `main` プッシュ時に自動ビルド・GitHub Pages デプロイを行う。

### 構成

- ワークフロー: `.github/workflows/deploy.yml`
- ランタイム: Bun（ADR-009 に準拠、`setup-bun` action を使用）
- MoonBit: 公式インストールスクリプトで CI に導入
- デプロイ: `actions/upload-pages-artifact` + `actions/deploy-pages`

### vite.config.ts の変更

GitHub Pages は `https://<user>.github.io/<repo>/` にデプロイされるため、
`base: '/word-ga/'` を設定してアセットパスを正しく解決する。

## Consequences

### メリット
- `main` プッシュで自動デプロイ（手動操作不要）
- 外部サービス不要（GitHub 完結）
- Bun を CI でも使用（ADR-009 と一貫）

### トレードオフ
- `vite.config.ts` に `base` を追加するため、ローカルの `bun run dev` と GitHub Pages で base パスが異なる（開発時は問題なし）
- MoonBit のインストールに数十秒かかる
