# API設計

## 基本情報

- ベースURL: `/api`
- レスポンスフォーマット: JSON
- エラーハンドリング: HTTPステータスコードとエラーメッセージを返却

## エンドポイント一覧

### 1. お気に入り登録

```
POST /bookmarks/:id/favorite
```

#### リクエスト
- パラメータ
  - `id`: ブックマークID (数値)

#### レスポンス
- 成功時 (200 OK)
```json
{
  "success": true
}
```

- エラー時
  - 404: ブックマークが存在しない
  - 409: 既にお気に入り登録済み
```json
{
  "success": false,
  "message": "エラーメッセージ"
}
```

### 2. お気に入り解除

```
DELETE /bookmarks/:id/favorite
```

#### リクエスト
- パラメータ
  - `id`: ブックマークID (数値)

#### レスポンス
- 成功時 (200 OK)
```json
{
  "success": true
}
```

- エラー時
  - 404: ブックマークが存在しない、またはお気に入り登録されていない
```json
{
  "success": false,
  "message": "エラーメッセージ"
}
```

### 3. お気に入り一覧取得

```
GET /bookmarks/favorites
```

#### リクエスト
- クエリパラメータ（オプション）
  - `page`: ページ番号（デフォルト: 1）
  - `limit`: 1ページあたりの件数（デフォルト: 20）

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
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

- エラー時
  - 400: 不正なパラメータ
```json
{
  "success": false,
  "message": "エラーメッセージ"
}
```

## 実装方針

### ルーティング実装

```typescript
// api/src/routes/bookmarks.ts

// お気に入り機能のルーティングを追加
app.post("/:id/favorite", async (c) => {
  try {
    const id = Number.parseInt(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
    }

    await bookmarkService.addToFavorites(id);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Bookmark not found") {
        return c.json({ success: false, message: "Bookmark not found" }, 404);
      }
      if (error.message === "Already favorited") {
        return c.json(
          { success: false, message: "Already added to favorites" },
          409
        );
      }
    }
    console.error("Failed to add to favorites:", error);
    return c.json(
      { success: false, message: "Failed to add to favorites" },
      500
    );
  }
});

app.delete("/:id/favorite", async (c) => {
  // お気に入り解除の実装
});

app.get("/favorites", async (c) => {
  // お気に入り一覧取得の実装
});
```

### サービス層実装

```typescript
// api/src/services/bookmark.ts

export interface BookmarkService {
  // 既存のメソッドに追加
  addToFavorites(bookmarkId: number): Promise<void>;
  removeFromFavorites(bookmarkId: number): Promise<void>;
  getFavoriteBookmarks(page?: number, limit?: number): Promise<{
    bookmarks: Array<Bookmark & { isFavorite: boolean }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  }>;
}
```

### リポジトリ層実装

```typescript
// api/src/repositories/bookmark.ts

export interface BookmarkRepository {
  // 既存のメソッドに追加
  addToFavorites(bookmarkId: number): Promise<void>;
  removeFromFavorites(bookmarkId: number): Promise<void>;
  getFavoriteBookmarks(offset: number, limit: number): Promise<{
    bookmarks: Array<Bookmark & { isFavorite: boolean }>;
    total: number;
  }>;
  isFavorite(bookmarkId: number): Promise<boolean>;
}
