# GET /unread - 未読ブックマークの取得

## 概要

未読の（isRead = false）ブックマークの一覧を取得します。

## リクエスト

### エンドポイント

```
GET /unread
```

### パラメータ

なし

## レスポンス

### 成功時 (200 OK)

```json
{
  "success": true,
  "bookmarks": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example Title",
      "isRead": false,
      "createdAt": "2024-03-01T12:00:00.000Z",
      "updatedAt": "2024-03-01T12:00:00.000Z"
    }
  ]
}
```

### レスポンスフィールド

| フィールド | 型 | 説明 |
|------------|------|-------------|
| success | boolean | リクエストの成功・失敗を示すフラグ |
| bookmarks | array | 未読ブックマークの配列 |
| bookmarks[].id | number | ブックマークのID |
| bookmarks[].url | string | ブックマークのURL |
| bookmarks[].title | string | ブックマークのタイトル |
| bookmarks[].isRead | boolean | 既読フラグ（常にfalse） |
| bookmarks[].createdAt | string | 作成日時（ISO 8601形式） |
| bookmarks[].updatedAt | string | 更新日時（ISO 8601形式） |

### エラー時 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to fetch unread bookmarks"
}
```

### エラーレスポンスフィールド

| フィールド | 型 | 説明 |
|------------|------|-------------|
| success | boolean | false |
| message | string | エラーメッセージ |