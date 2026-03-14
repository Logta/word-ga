---
name: fix-issue
description: GitHub Issue を分析して修正するワークフロー
disable-model-invocation: true
---

GitHub Issue を分析して修正する: $ARGUMENTS

1. `gh issue view $ARGUMENTS` で Issue の詳細を確認する
2. 問題の根本原因をコードベースで特定する
3. 修正を実装し、関連するテストを追加・修正する
4. `bun run test` と `bun run lint` を実行して確認する
5. MoonBit を変更した場合は `moon build --target wasm-gc --release` も確認する
6. ADR が必要な変更かどうか判断する（`CLAUDE.md` の ADR ルール参照）
7. 説明的なコミットメッセージで commit し、PR を作成する
