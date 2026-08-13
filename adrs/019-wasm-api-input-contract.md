# ADR-019: Wasm公開APIの入力契約を明示し、契約違反を即時abortする

**Status**: Accepted

## Context

コードレビューで、公開 Wasm API（`evolve` / `calc_fitness`）が入力検証を一切持たず、以下が実測で再現できることが確認された。

- `evolve("10101", "11111", "elite")`（pop_size=1）: `elite_count` が 2 に切り上げられ `pop[1]` で index out of bounds トラップ
- 空個体: `crossover` の `rand_int(p1.length())` が `% 0` で remainder by zero
- ターゲットより短い個体: `calc_fitness` がターゲット長でループして個体側の索引でトラップ
- 空ターゲット: `0.0 / 0.0 = NaN` が best/avg/solved 判定を汚染

これらは UI 層のガード1つ（`useSimulator` の trim）だけで防がれており、Wasm 層自体は無防備だった。

また、選択戦略の dispatch（ADR-015）は `_ =>` ワイルドカードで未知の文字列を無警告でエリート選択にフォールバックさせていた。TS 側の `SelectionMethod` に新戦略を追加して MoonBit 実装を忘れても、型チェック・コンパイル・実行の全てが素通りし、UI は新戦略を表示しながら実際はエリート選択が走る。ADR-015 が採用理由に挙げた「match で漏れ検出」はワイルドカードによって構造的に打ち消されていた。

TS 側にも同根の問題があった: `initState` は空ターゲットを受理し、`charToBin` は未知文字を黙って 'A' に写像していた。

## Decision

**Wasm 公開 API の入力契約を「非空・ターゲットと等長・'0'/'1' のみのバイナリ文字列」と明示し、契約違反は `abort` で即時トラップさせる。**

- `evolve`: 冒頭でターゲット（非空・バイナリ）と全個体（等長・バイナリ）を検証
- `calc_fitness`: 非空ターゲット・個体との等長を検証
- `elite_select`: `elite_count` を集団サイズでクランプ（pop_size=1 でもトラップしない）
- 選択戦略 dispatch: `"elite"` を明示アームにし、`_ => abort("unknown selection method")` で契約違反を即検出（**ADR-015 の一部改訂**）
- TS 側: `initState` は空白のみのターゲットを throw で拒否、`charToBin` は未知文字で throw（寛容な補正は `sanitize()` に一元化）

## Consequences

- 契約違反は静かな誤動作（NaN 汚染・意図しない戦略へのフォールバック）ではなく即時の失敗として現れ、デバッグコストが下がる
- 正常系のパフォーマンスへの影響は集団1回走査分のみで無視できる
- `abort` は wasm トラップとして JS 側に `RuntimeError` で伝播する。UI 層は従来通り `sanitize` / trim ガードで正常入力のみを渡すため、ユーザー操作でトラップに到達する経路はない
- MoonBit のホワイトボックステストに panic テスト（`test "panic ..."` 規約）で契約違反時の abort を固定する
