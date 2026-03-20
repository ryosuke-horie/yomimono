# 実装タスク: rss-reader

## 要件カバレッジ

| 要件 | タスク |
|------|--------|
| 1.1, 1.2, 1.3 | 1.1 |
| 4.1, 4.2 | 2.1, 2.2 |
| 2.1, 2.4 | 3.1 |
| 2.1, 2.2, 2.3, 2.5 | 3.2 |
| 2.1 | 3.3 |
| 3.1, 3.2 | 4.1 |
| 5.1, 5.2, 5.3 | 5.1 |

## タスク

### 1. フィード定義の作成

#### 1.1 フィード定義ファイルと型を作成する

- [ ] `api/src/config/feeds.ts` に `FeedDefinition` 型と `FEED_DEFINITIONS` 定数配列を作成する
- [ ] `FeedDefinition` 型は `id`（string）、`url`（string）、`title`（string）を持つ
- [ ] 初期フィードとしてサンプルエントリを1件以上含める
- [ ] `FEED_DEFINITIONS` は `readonly` で型安全にする
- [ ] in-source test で型と定義の整合性を検証する

要件: 1.1, 1.2, 1.3

### 2. データモデル拡張

#### 2.1 bookmarks テーブルに feedId カラムを追加する

- [ ] `api/src/db/schema.ts` の `bookmarks` テーブルに `feedId: text("feed_id")` を追加する（nullable）
- [ ] `Bookmark` 型と `InsertBookmark` 型に `feedId` が含まれることを確認する

要件: 4.1

#### 2.2 Drizzle マイグレーションを生成・適用する

- [ ] `pnpm run db:generate` でマイグレーションファイルを生成する
- [ ] マイグレーション SQL が `ALTER TABLE bookmarks ADD COLUMN feed_id TEXT` であることを確認する
- [ ] `pnpm run migrate:development` で開発環境に適用し、既存データに影響がないことを確認する

要件: 4.2

### 3. RSS フィード取得機能

#### 3.1 FeedFetcher サービスを実装する

- [ ] `api/src/services/feed-fetcher.ts` に `IFeedFetcher` インターフェースと実装を作成する
- [ ] `fast-xml-parser` を依存に追加する（`cd api && pnpm add fast-xml-parser`）
- [ ] RSS 2.0（`<channel><item>`）と Atom（`<feed><entry>`）の両フォーマットに対応する
- [ ] 各記事から `url` と `title` を抽出して `FeedArticle` 配列を返す
- [ ] fetch エラー・パースエラー時はエラーをログに記録し空配列を返す（例外を投げない）
- [ ] in-source test で RSS/Atom 両フォーマットのパースを検証する

要件: 2.1, 2.4

#### 3.2 RssFeedService を実装する

- [ ] `api/src/services/rss-feed.ts` に `IRssFeedService` インターフェースと実装を作成する
- [ ] `FEED_DEFINITIONS` の全フィードに対して `FeedFetcher.fetchArticles()` を実行する
- [ ] 取得した記事 URL で既存 bookmarks を検索し、未登録の記事のみをフィルタリングする（重複排除）
- [ ] 新規記事を `BookmarkRepository.createMany()` で一括保存する（`feedId` を設定）
- [ ] in-source test で重複排除ロジックとフィード統合フローを検証する

要件: 2.1, 2.2, 2.3, 2.5

#### 3.3 Scheduled ハンドラと Cron Triggers を設定する

- [ ] `api/src/index.ts` のデフォルトエクスポートに `scheduled` ハンドラを追加する
- [ ] `scheduled` ハンドラ内で `RssFeedService` を初期化して `fetchAndSaveAllFeeds()` を呼び出す
- [ ] `api/wrangler.jsonc` に `"triggers": { "crons": ["0 * * * *"] }` を追加する

要件: 2.1

### 4. 表示統合の確認

#### 4.1 既存の bookmark 一覧で RSS 記事が正しく表示されることを確認する

- [ ] `feedId` が設定された bookmark が既存の未読一覧 API（`GET /api/bookmarks`）で返されることを確認する
- [ ] 既読マーク・お気に入り操作が RSS 記事に対しても正常に動作することを確認する
- [ ] 既存テストが `feedId` 追加後も全てパスすることを確認する（`cd api && pnpm run test`）

要件: 3.1, 3.2

### 5. Claude Code Skill

#### 5.1 `/rss-add` スキルを作成する

- [ ] `.claude/skills/rss-add.md` にスキルファイルを作成する
- [ ] スキルの処理: 引数の URL を `WebFetch` で取得し、RSS/Atom としてパース可能か検証する
- [ ] パース成功時、フィードタイトルを XML から自動取得する
- [ ] フィード ID をタイトルから kebab-case で自動生成する
- [ ] `api/src/config/feeds.ts` の `FEED_DEFINITIONS` 配列に新しいエントリを `Edit` ツールで追記する
- [ ] CLAUDE.md のスキル一覧セクションに `/rss-add` を追加する

要件: 5.1, 5.2, 5.3
