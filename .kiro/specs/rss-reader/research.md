# リサーチログ: rss-reader

## 概要

RSS リーダー機能を既存の yomimono アーキテクチャに統合するための技術調査。
フィード URL はハードコード管理、記事は既存 bookmarks テーブルに統合する方針。

## 調査ログ

### 1. RSS パーシングライブラリの Cloudflare Workers 互換性

Cloudflare Workers は V8 isolate で動作するため、Node.js 固有の API（XMLHttpRequest 等）に依存するライブラリは使用不可。

| ライブラリ | CF Workers 互換 | 備考 |
|-----------|----------------|------|
| `rss-parser` | NG | XMLHttpRequest を使用、CF Workers で動作しない |
| `fast-xml-parser` | OK | 純粋な JS パーサー、CF Workers で動作実績あり |
| `htmlparser2` | OK | 軽量 DOM パーサー、CF Workers で利用可能 |
| 手動パース (RegExp) | OK | 依存なし、ただしメンテナンス性が低い |

結論: `fast-xml-parser` を採用。軽量で CF Workers 実績があり、RSS/Atom 両対応可能。

### 2. 既存アーキテクチャとの統合ポイント

- レイヤード構成: routes -> services -> repositories -> db
- 既存の `bookmarks` テーブルに `feedId` (nullable) を追加して RSS 記事を統合
- `bookmarks.url` にユニーク制約があるため、重複排除は URL ベースで自然に実現可能
- Cron Triggers は wrangler.jsonc に未設定 → 新規追加が必要

### 3. Cloudflare Workers Cron Triggers

- `wrangler.jsonc` の `triggers.crons` に定義
- エントリポイントで `scheduled` ハンドラをエクスポート
- 最小間隔: 1分（`* * * * *`）
- 推奨間隔: 1時間に1回程度（`0 * * * *`）で十分

### 4. フィード定義のハードコード設計

- `api/src/config/feeds.ts` に定数配列として定義
- 型安全な `FeedDefinition` 型を使用
- フィードの追加・削除はコード変更 + デプロイで対応

## リスクと軽減策

| リスク | 影響 | 軽減策 |
|--------|------|--------|
| フィード取得タイムアウト | Cron 実行時間超過 | フィードごとに個別 try-catch、タイムアウト設定 |
| 大量記事の一括挿入 | D1 書き込み制限 | バッチサイズ制限、既存 createMany パターン活用 |
| XML パースエラー | 不正な RSS フォーマット | fast-xml-parser のエラーハンドリング、フィード単位でスキップ |
