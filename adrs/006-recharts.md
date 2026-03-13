# ADR-006: グラフ描画に recharts を採用

**Status**: Accepted

## Context

遺伝的アルゴリズムの進捗を視覚化するため、世代ごとの最高適応度・平均適応度の折れ線グラフが必要だった。React エコシステムには Chart.js、Victory、Nivo、recharts など複数の選択肢がある。React との統合容易性とシンプルな API を優先して選定した。

## Decision

recharts v3 を採用した。`LineChart`・`Line`・`XAxis`・`YAxis`・`Tooltip`・`Legend` コンポーネントを組み合わせて、世代（X軸）対適応度（Y軸）の折れ線グラフを描画する。

recharts v3 では `Tooltip` の `formatter` の `value` 引数の型が `ValueType | undefined` になったため、`Number(value)` でキャストしている。

## Consequences

### メリット
- React コンポーネントとして自然に使える宣言的 API
- SVG ベースでスケーラブル、レスポンシブ対応が容易（`ResponsiveContainer`）
- 折れ線グラフ・棒グラフなど基本的なチャートタイプが揃っている
- TypeScript 型定義が同梱されている

### トレードオフ
- v3 で `Tooltip formatter` の型が変わるなど、マイナーバージョンでも破壊的変更が入ることがある
- 高度なカスタマイズ（アニメーション、インタラクション）には制約がある場合がある
- バンドルサイズがやや大きい（ただし動的インポートで分割可能）
