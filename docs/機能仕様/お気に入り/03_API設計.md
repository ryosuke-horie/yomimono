# API設計

## エンドポイント一覧

### 1. お気に入り登録
```
POST /api/bookmarks/:id/favorite
```

#### リクエスト
- パラメータ
  - `id`: お気に入りに登録するブックマークのID (数値)
- ヘッダー
  ```
  Content-Type: application/json
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true
  }
  ```
- エラー時
  - 404: ブックマークが存在しない
    ```json
    {
      "success": false,
      "message": "Bookmark not found"
    }
    ```
  - 409: 既にお気に入り登録済み
    ```json
    {
      "success": false,
      "message": "Already added to favorites"
    }
    ```

### 2. お気に入り解除
```
DELETE /api/bookmarks/:id/favorite
```

#### リクエスト
- パラメータ
  - `id`: お気に入りから解除するブックマークのID (数値)
- ヘッダー
  ```
  Content-Type: application/json
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true
  }
  ```
- エラー時
  - 404: お気に入りが存在しない
    ```json
    {
      "success": false,
      "message": "Favorite not found"
    }
    ```

### 3. お気に入り一覧取得
```
GET /api/bookmarks/favorites
```

#### リクエスト
- ヘッダー
  ```
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "bookmarks": [
      {
        "id": 1,
        "url": "https://example.com",
        "title": "サンプルタイトル",
        "isRead": false,
        "isFavorite": true,
        "createdAt": "2024-04-04T12:00:00Z",
        "updatedAt": "2024-04-04T12:00:00Z"
      }
    ]
  }
  ```
- エラー時
  - 500: サーバーエラー
    ```json
    {
      "success": false,
      "message": "Failed to fetch favorites"
    }
    ```

## 実装詳細

### 1. ルーティング実装（Hono）
```typescript
// お気に入り登録
app.post("/:id/favorite", async (c) => {
  const id = Number.parseInt(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
  }
  await bookmarkService.addToFavorites(id);
  return c.json({ success: true });
});

// お気に入り解除
app.delete("/:id/favorite", async (c) => {
  const id = Number.parseInt(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
  }
  await bookmarkService.removeFromFavorites(id);
  return c.json({ success: true });
});

// お気に入り一覧取得
app.get("/favorites", async (c) => {
  const result = await bookmarkService.getFavoriteBookmarks();
  return c.json({ success: true, ...result });
});
```

### 2. エラーハンドリング
- バリデーションエラー
  - 不正なID形式 → 400 Bad Request
  - 存在しないブックマーク → 404 Not Found
  - 重複登録 → 409 Conflict
- サーバーエラー → 500 Internal Server Error

### 3. レスポンスデータの整形
- 日時は常にISO 8601形式（UTC）で返却
- ブックマークデータにはisFavoriteフラグを追加
- メッセージは適切な文言で返却

### 4. セキュリティ
- Content-TypeとAcceptヘッダーのバリデーション
- パラメータの型チェックと値の検証
- エラーメッセージは適切な粒度で開示
