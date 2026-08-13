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
- そのため MoonBit は `[env] MOONBIT_VERSION` で希望バージョンを宣言し、`mise run moon:setup` タスクが未導入時に公式インストーラを呼び出す形で「バージョンの単一情報源」だけ mise に寄せる

**案B: mise を導入しない（現状維持）**
- 個別管理を継続。再現性の問題は残る

**案C: Docker等でコンテナ化**
- 完全な再現性は得られるが、ローカル開発のフットプリントが重くなる。MoonBit/wasm-gcのビルドや素早いイテレーションを重視する本プロジェクトの開発体験には過剰

## Decision

**案Aを採用する。** `mise.toml` を新設し、bun のバージョンを `[tools]` で固定、既存 `bun run <script>` 群を `[tasks]` でラップする。MoonBit は汎用バックエンドで管理できないため、バージョン文字列を `[env] MOONBIT_VERSION` で宣言し、`mise run moon:setup` で公式インストーラを呼ぶ運用にとどめる。

## Consequences

### 導入後の構成

| 責務 | 管理方法 |
|---|---|
| bun バージョン | `mise.toml` `[tools]`（mise core backend） |
| MoonBit バージョン宣言 | `mise.toml` `[env] MOONBIT_VERSION`（実インストールは公式インストーラ、`mise run moon:setup`) |
| 日常コマンド | `mise.toml` `[tasks]`（`mise run dev/build/test/lint/fmt` 等） |
| `package.json` scripts | 従来通り残す（`mise tasks` はこれをラップするのみで置き換えない。`bun run dev` も引き続き使用可能） |

### 良い点

- `mise.toml` を見れば必要なツールバージョンとよく使うコマンドが一目でわかる
- `bun` のバージョンが固定され、環境差異による問題を防げる
- `mise run build` は `moon:build`（wasm-gc ビルド）に依存させているため、MoonBit のビルド漏れによる古いwasmを使ってしまう事故を防げる

### 制約・今後の課題

- MoonBit 自体は mise が「バージョンを取得してインストールする」対象にはなっていない（バージョン宣言のみ）。公式が mise/asdf 向けの配布形式を用意すれば移行を検討する
- CI（`.github/workflows/`）は本ADRの対象外。CI側で mise を使うかは別途検討する
