# 技術設計: rss-reader

## アーキテクチャパターンと境界マップ

既存のレイヤードアーキテクチャ（routes -> services -> repositories -> db）を踏襲する。
RSS フィード取得は Cloudflare Workers の Cron Triggers で定期実行し、
取得した記事は既存の `bookmarks` テーブルに統合する。

```
[Cron Triggers]
       |
       v
[scheduled handler] ---> [RssFeedService] ---> [BookmarkRepository]
       |                       |                        |
       |                       v                        v
       |                [FeedFetcher]              [D1 Database]
       |                  (fetch + parse)           (bookmarks)
       |
       v
[feeds.ts config] (ハードコード定義)
```

フィード定義はコード内の定数として管理し、DB テーブルは不要。
RSS 経由の記事は既存の bookmark として保存され、フロントエンドからは区別なく表示される。

## 技術スタックと整合性

| 要素 | 技術 | 既存との整合 |
|------|------|-------------|
| RSS パース | fast-xml-parser | CF Workers 互換、純粋 JS |
| 定期実行 | Cloudflare Cron Triggers | wrangler.jsonc に追加 |
| データ保存 | Drizzle ORM + D1 | 既存パターン踏襲 |
| 重複排除 | bookmarks.url ユニーク制約 | 既存の仕組みを活用 |

## コンポーネントとインターフェース定義

### 1. フィード定義 (要件 1.1, 1.2, 1.3)

`api/src/config/feeds.ts`

```typescript
type FeedDefinition = {
  id: string;       // フィード識別子 (例: "zenn-trending")
  url: string;      // RSS フィード URL
  title: string;    // 表示名
};

const FEED_DEFINITIONS: readonly FeedDefinition[] = [
  // ハードコードで定義
];
```

フィードの追加・削除はこのファイルを編集してデプロイする。

### 2. フィード取得・パース (要件 2.1, 2.4)

`api/src/services/feed-fetcher.ts`

RSS/Atom フィードを fetch して記事リストに変換する。

```typescript
type FeedArticle = {
  url: string;
  title: string;
};

interface IFeedFetcher {
  // 指定フィードから記事一覧を取得する
  // フェッチまたはパースに失敗した場合はエラーをログに記録し空配列を返す
  fetchArticles(feed: FeedDefinition): Promise<FeedArticle[]>;
}
```

- `fast-xml-parser` で XML をパース
- RSS 2.0 (`<item>`) と Atom (`<entry>`) の両フォーマットに対応
- フィードごとに独立した try-catch でエラー分離 (要件 2.4)

### 3. RSS フィードサービス (要件 2.1, 2.2, 2.3, 2.5)

`api/src/services/rss-feed.ts`

Cron Triggers から呼び出されるオーケストレーションサービス。

```typescript
interface IRssFeedService {
  // 全定義フィードから新着記事を取得し bookmarks として保存する
  fetchAndSaveAllFeeds(): Promise<void>;
}
```

処理フロー:
1. `FEED_DEFINITIONS` から全フィードを取得
2. 各フィードに対して `IFeedFetcher.fetchArticles()` を実行
3. 取得した記事 URL で既存 bookmarks を検索（重複排除 - 要件 2.3）
4. 新規記事のみ `IBookmarkRepository.createMany()` で一括保存（要件 2.2, 2.5）
5. 各記事の `feedId` にフィード定義の `id` を設定

### 4. Scheduled ハンドラ (要件 2.1)

`api/src/index.ts` に `scheduled` エクスポートを追加。

```typescript
export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    // RssFeedService を初期化して fetchAndSaveAllFeeds() を実行
  },
};
```

### 5. データモデル拡張 (要件 4.1, 4.2)

`api/src/db/schema.ts` に `feedId` カラムを追加。

```typescript
// bookmarks テーブルに追加
feedId: text("feed_id")  // nullable, FeedDefinition.id に対応
```

- nullable: Chrome 拡張経由の記事は `feedId = null`
- RSS 経由の記事は `feedId = FeedDefinition.id`
- DB 上のテーブルとしての `feeds` は作成しない（ハードコード管理のため）

マイグレーション: `ALTER TABLE bookmarks ADD COLUMN feed_id TEXT` のみ。
既存データは `feed_id = null` のまま保持され影響なし。

### 6. 記事の表示統合 (要件 3.1, 3.2)

フロントエンド側の変更は不要。RSS 経由の記事は `bookmarks` テーブルに保存されるため、
既存の未読一覧・既読管理・お気に入り機能がそのまま適用される。

### 7. フィード管理用 Claude Code Skill (要件 5.1, 5.2, 5.3)

`.claude/skills/rss-add.md`

`/rss-add <URL>` コマンドで `api/src/config/feeds.ts` にフィード定義を追加するスキル。

処理フロー:
1. 指定 URL を fetch して RSS/Atom としてパース可能か検証 (要件 5.2)
2. フィードのタイトルを XML から自動取得 (要件 5.3)
3. フィード ID をタイトルから自動生成（kebab-case）
4. `FEED_DEFINITIONS` 配列に新しいエントリを追記 (要件 5.1)
5. 追加結果をユーザーに表示

スキルファイルにはプロンプトテンプレートとして上記手順を記述し、
Claude Code が `WebFetch` でフィード URL を検証 → `Edit` で `feeds.ts` を更新する流れとする。

## wrangler.jsonc の変更

```jsonc
{
  "triggers": {
    "crons": ["0 * * * *"]  // 毎時0分に実行
  }
}
```

## 要件トレーサビリティ

| 要件 | コンポーネント |
|------|---------------|
| 1.1, 1.2, 1.3 | `config/feeds.ts` - FeedDefinition 定数 |
| 2.1 | scheduled ハンドラ + Cron Triggers |
| 2.2, 2.5 | RssFeedService + BookmarkRepository.createMany |
| 2.3 | RssFeedService 内の URL ベース重複排除 |
| 2.4 | FeedFetcher のフィード単位エラーハンドリング |
| 3.1, 3.2 | 既存フロントエンド（変更不要） |
| 4.1 | schema.ts の feedId カラム追加 |
| 4.2 | Drizzle マイグレーション |
| 5.1 | `.claude/skills/rss-add.md` スキル |
| 5.2 | スキル内のフィード URL 検証 |
| 5.3 | スキル内のタイトル自動取得 |
