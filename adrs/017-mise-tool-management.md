# ADR-017: mise を開発環境のツールバージョン管理・タスクランナーの中心に据える

**Status**: Accepted

## Context

これまで開発環境は以下のように個別管理されていた。

- bun: ローカルにインストールされたものをそのまま利用（バージョン固定なし）
- MoonBit (`moon`): 公式インストーラでローカルにインストール（バージョン固定なし）
- コマンド群: `package.json` の `scripts` に集約（`bun run dev` 等）

チーム/CI間でのバージョン差異による再現性の問題を避けたい。`mise`（jdx/mise、旧rtx）はランタイムバージョン管理とタスクランナーを兼ねるツールで、`mise.toml` 一つで両方を宣言的に管理できる。

### 検討した選択肢

**案A: mise を導入し、`mise.toml` を環境の中心に置く**
- `[tools]` で bun のバージョンを固定
- `[tasks]` で `bun run dev` 等の既存 `package.json` scripts をラップし、`mise run dev` のような統一入口を用意
- MoonBit は mise 標準の tool backend（core/asdf/ubi等）に対応するものがない（`moon` は単純な単一バイナリではなく、公式インストーラがバージョンごとの `core` ライブラリ取得・bundle処理まで行うため、汎用バックエンドでは代替できない）。コミュニティ製 asdf プラグイン（`cometkim/asdf-moonbit`）も存在するが更新が1年以上止まっており信頼できない
- MoonBit公式CDNの調査により、日付付きビルド（例: `0.1.20260807`）は公開から1週間程度でCDNから403となり取得不能になることが判明した（`https://cli.moonbitlang.com/binaries/<version>/...` で実測）。特定バージョンへのピン留めは実質不可能で、`latest` を追いかける以外の選択肢がない。そのため MoonBit は `mise run moon:setup` タスクが未導入時に公式インストーラを（バージョン指定なし = latest で）呼び出すだけにとどめる

**案B: mise を導入しない（現状維持）**
- 個別管理を継続。再現性の問題は残る

**案C: Docker等でコンテナ化**
- 完全な再現性は得られるが、ローカル開発のフットプリントが重くなる。MoonBit/wasm-gcのビルドや素早いイテレーションを重視する本プロジェクトの開発体験には過剰

## Decision

**案Aを採用する。** `mise.toml` を新設し、bun のバージョンを `[tools]` で固定、既存 `bun run <script>` 群を `[tasks]` でラップする。MoonBit は汎用バックエンドで管理できず、かつ公式CDNの保持期間の都合でバージョンピン留め自体ができないため、`mise run moon:setup` で公式インストーラ（latest）を呼ぶ運用にとどめる。

## Consequences

### 導入後の構成

| 責務 | 管理方法 |
|---|---|
| bun バージョン | `mise.toml` `[tools]`（mise core backend、固定可能） |
| MoonBit | `mise run moon:setup`（公式インストーラ、常に latest。ピン留め不可） |
| 日常コマンド | `mise.toml` `[tasks]`（`mise run dev/build/test/lint/fmt` 等） |
| `package.json` scripts | 従来通り残す（`mise tasks` はこれをラップするのみで置き換えない。`bun run dev` も引き続き使用可能） |

### 良い点

- `mise.toml` を見れば必要なツールバージョンとよく使うコマンドが一目でわかる
- `bun` のバージョンが固定され、環境差異による問題を防げる
- `mise run build` は `moon:build`（wasm-gc ビルド）に依存させているため、MoonBit のビルド漏れによる古いwasmを使ってしまう事故を防げる

### 制約・今後の課題

- MoonBit 自体は mise が「バージョンを取得してインストールする」対象にはなっていない。加えて公式CDNが日付付きビルドを長期保持しないため、バージョンピン留め自体が不可能（`latest` 追従のみ）。CI側もこの制約を前提に unpinned install のままとする（`.github/workflows/ci.yml` / `deploy.yml`）。公式が寿命の長い配布形式（mise/asdf対応や長期保持されるリリースタグ等）を用意すれば移行を検討する
- **latest追従によるドリフトの検知**: `latest` を追いかける以上、moon側の破壊的変更（設定ファイル形式の非推奨化等）がpush/PRの無い期間に入ると、次に誰かがPRを立てた時に初めて気づく形になる（2026-08のPRで実際に発生：`moon.mod.json`/`is_main`が非推奨化されCIが落ちた。3月の最終pushからの約5ヶ月の空白期間にドリフトしていた）。`.github/workflows/ci.yml` に週次の `schedule` トリガーを追加し、コード変更が無くてもmainに対して定期的にCIを回すことで早期検知する
- CI（`.github/workflows/`）は本ADRの対象外。CI側で mise を使うかは別途検討する
