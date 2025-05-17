# RSS読み込み機能API設計

## APIエンドポイント一覧

### 1. RSSフィード管理API

#### 1.1 RSSフィード一覧取得
```
GET /api/rss/feeds
```

**レスポンス**
```json
{
  "feeds": [
    {
      "id": 1,
      "name": "Cloudflare Blog",
      "url": "https://blog.cloudflare.com/rss/",
      "isActive": true,
      "updateInterval": 3600,
      "lastFetchedAt": "2024-01-15T10:00:00Z",
      "nextFetchAt": "2024-01-15T11:00:00Z",
      "itemCount": 150,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5
}
```

#### 1.2 RSSフィード詳細取得
```
GET /api/rss/feeds/:id
```

**レスポンス**
```json
{
  "id": 1,
  "name": "Cloudflare Blog",
  "url": "https://blog.cloudflare.com/rss/",
  "isActive": true,
  "updateInterval": 3600,
  "lastFetchedAt": "2024-01-15T10:00:00Z",
  "nextFetchAt": "2024-01-15T11:00:00Z",
  "labels": [
    {
      "id": 10,
      "name": "Cloudflare"
    },
    {
      "id": 20,
      "name": "インフラ"
    }
  ],
  "stats": {
    "totalItems": 150,
    "todayItems": 3,
    "lastWeekItems": 12
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### 1.3 RSSフィード登録
```
POST /api/rss/feeds
```

**リクエスト**
```json
{
  "name": "Google Cloud Blog",
  "url": "https://cloud.google.com/blog/feed",
  "isActive": true,
  "updateInterval": 3600,
  "labelIds": [30, 40]
}
```

**レスポンス**
```json
{
  "id": 2,
  "name": "Google Cloud Blog",
  "url": "https://cloud.google.com/blog/feed",
  "isActive": true,
  "updateInterval": 3600,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

#### 1.4 RSSフィード更新
```
PUT /api/rss/feeds/:id
```

**リクエスト**
```json
{
  "name": "Google Cloud Blog （更新）",
  "isActive": false,
  "updateInterval": 7200,
  "labelIds": [30, 40, 50]
}
```

#### 1.5 RSSフィード削除
```
DELETE /api/rss/feeds/:id
```

**クエリパラメータ**
- `deleteBookmarks`: boolean（関連ブックマークも削除するか）

### 2. RSS記事管理API

#### 2.1 RSS記事一覧取得
```
GET /api/rss/items
```

**クエリパラメータ**
- `feedId`: number（フィルタリング用）
- `limit`: number（デフォルト: 20）
- `offset`: number（デフォルト: 0）

**レスポンス**
```json
{
  "items": [
    {
      "id": 100,
      "feedId": 1,
      "feedName": "Cloudflare Blog",
      "guid": "https://blog.cloudflare.com/?p=12345",
      "url": "https://blog.cloudflare.com/article-slug",
      "title": "記事タイトル",
      "description": "記事の概要...",
      "publishedAt": "2024-01-15T09:00:00Z",
      "bookmarkId": 500,
      "isBookmarked": true,
      "fetchedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### 3. RSSバッチ実行API

#### 3.1 手動バッチ実行
```
POST /api/rss/batch/execute
```

**リクエスト**
```json
{
  "feedIds": [1, 2, 3] // 空配列の場合は全フィードを実行
}
```

**レスポンス**
```json
{
  "jobId": "batch-12345",
  "status": "started",
  "targetFeeds": 3,
  "startedAt": "2024-01-15T12:00:00Z"
}
```

#### 3.2 バッチ実行履歴取得
```
GET /api/rss/batch/logs
```

**クエリパラメータ**
- `feedId`: number（フィルタリング用）
- `status`: string（success/error）
- `limit`: number（デフォルト: 20）

**レスポンス**
```json
{
  "logs": [
    {
      "id": 1000,
      "feedId": 1,
      "feedName": "Cloudflare Blog",
      "status": "success",
      "itemsFetched": 5,
      "itemsCreated": 2,
      "errorMessage": null,
      "startedAt": "2024-01-15T10:00:00Z",
      "finishedAt": "2024-01-15T10:00:30Z",
      "duration": 30
    }
  ],
  "total": 100
}
```

### 4. RSS統計API

#### 4.1 RSS統計情報取得
```
GET /api/rss/stats
```

**レスポンス**
```json
{
  "totalFeeds": 5,
  "activeFeeds": 4,
  "totalItems": 500,
  "todayItems": 15,
  "lastWeekItems": 85,
  "topFeeds": [
    {
      "id": 1,
      "name": "Cloudflare Blog",
      "itemCount": 150
    }
  ],
  "recentErrors": [
    {
      "feedId": 3,
      "feedName": "Unknown Blog",
      "lastError": "Connection timeout",
      "errorCount": 3
    }
  ]
}
```

## 共通仕様

### 認証
- Cloudflare Accessによる認証が必要
- Workerへのアクセスは内部トークンで制御

### エラーレスポンス
```json
{
  "error": {
    "code": "INVALID_FEED_URL",
    "message": "指定されたURLは有効なRSSフィードではありません",
    "details": {
      "url": "https://example.com/invalid-feed"
    }
  }
}
```

### ステータスコード
- 200: 成功
- 201: 作成成功
- 400: リクエストエラー
- 401: 認証エラー
- 404: リソースが見つからない
- 500: サーバーエラー

### ページネーション
- `limit`と`offset`パラメータで制御
- レスポンスに`total`と`hasMore`を含む

### バリデーション
- URLの形式チェック
- RSSフィードの有効性確認
- 更新間隔の最小値チェック（300秒以上）