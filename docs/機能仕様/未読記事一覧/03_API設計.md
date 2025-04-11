# 未読記事一覧のAPI設計

## API概要

未読記事一覧機能では、以下のAPIエンドポイントを使用して、未読ブックマークの取得や状態更新を行います。

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|-----|------|
| GET | /api/bookmarks/unread | 未読ブックマーク一覧を取得 |
| PATCH | /api/bookmarks/:id/read | 指定したブックマークを既読に更新 |
| POST | /api/bookmarks/:id/favorite | 指定したブックマークをお気に入りに追加 |
| DELETE | /api/bookmarks/:id/favorite | 指定したブックマークをお気に入りから削除 |

## 詳細仕様

### 1. 未読ブックマーク一覧取得 API

**エンドポイント**: `GET /api/bookmarks/unread`

**リクエスト**:
- パラメータ: なし

**レスポンス**:
```json
{
  "success": true,
  "bookmarks": [
    {
      "id": 1,
      "url": "https://example.com/article1",
      "title": "サンプル記事1",
      "isRead": false,
      "isFavorite": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // ...他のブックマーク
  ],
  "totalUnread": 10,
  "todayReadCount": 5
}
```

**処理内容**:
1. リポジトリから未読ブックマーク一覧を取得
2. 未読ブックマークの総数を取得
3. 当日読了したブックマーク数を取得
4. 各ブックマークのお気に入り状態を付与
5. 結果をJSONで返却

**エラーハンドリング**:
- データベースエラー時: 500 Internal Server Error
- その他のエラー: 適切なステータスコードとエラーメッセージ

### 2. ブックマーク既読更新 API

**エンドポイント**: `PATCH /api/bookmarks/:id/read`

**リクエスト**:
- パスパラメータ: id (ブックマークID)

**レスポンス**:
```json
{
  "success": true,
  "message": "Bookmark marked as read"
}
```

**処理内容**:
1. 指定されたIDのブックマークを取得
2. isReadフラグをtrueに更新
3. 更新日時を現在時刻に更新
4. 成功メッセージを返却

**エラーハンドリング**:
- ブックマークが存在しない場合: 404 Not Found
- データベースエラー時: 500 Internal Server Error

### 3. お気に入り追加 API

**エンドポイント**: `POST /api/bookmarks/:id/favorite`

**リクエスト**:
- パスパラメータ: id (ブックマークID)

**レスポンス**:
```json
{
  "success": true,
  "message": "Added to favorites"
}
```

**処理内容**:
1. 指定されたIDのブックマークを確認
2. favoritesテーブルに新しいレコードを追加
3. 成功メッセージを返却

**エラーハンドリング**:
- ブックマークが存在しない場合: 404 Not Found
- 既にお気に入り登録されている場合: 409 Conflict
- データベースエラー時: 500 Internal Server Error

### 4. お気に入り削除 API

**エンドポイント**: `DELETE /api/bookmarks/:id/favorite`

**リクエスト**:
- パスパラメータ: id (ブックマークID)

**レスポンス**:
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

**処理内容**:
1. 指定されたIDのブックマークを確認
2. favoritesテーブルから該当レコードを削除
3. 成功メッセージを返却

**エラーハンドリング**:
- ブックマークが存在しない場合: 404 Not Found
- お気に入り登録されていない場合: 404 Not Found
- データベースエラー時: 500 Internal Server Error

## 実装詳細

### サービス層

```typescript
// BookmarkService インターフェース
interface BookmarkService {
  getUnreadBookmarksCount(): Promise<number>;
  getTodayReadCount(): Promise<number>;
  getUnreadBookmarks(): Promise<BookmarkWithFavorite[]>;
  markBookmarkAsRead(id: number): Promise<void>;
  addToFavorites(bookmarkId: number): Promise<void>;
  removeFromFavorites(bookmarkId: number): Promise<void>;
}

// DefaultBookmarkService 実装
class DefaultBookmarkService implements BookmarkService {
  constructor(private readonly repository: BookmarkRepository) {}

  async getUnreadBookmarksCount(): Promise<number> {
    return await this.repository.countUnread();
  }

  async getTodayReadCount(): Promise<number> {
    return await this.repository.countTodayRead();
  }

  async getUnreadBookmarks(): Promise<BookmarkWithFavorite[]> {
    return await this.repository.findUnread();
  }

  async markBookmarkAsRead(id: number): Promise<void> {
    const updated = await this.repository.markAsRead(id);
    if (!updated) {
      throw new Error("Bookmark not found");
    }
  }

  // お気に入り関連のメソッドは省略
}
```

### ルーティング

```typescript
// bookmarks.ts
export const bookmarksRoutes = new Hono()
  .get("/unread", async (c) => {
    const service = c.get("bookmarkService");
    
    try {
      const [bookmarks, totalUnread, todayReadCount] = await Promise.all([
        service.getUnreadBookmarks(),
        service.getUnreadBookmarksCount(),
        service.getTodayReadCount()
      ]);
      
      return c.json({
        success: true,
        bookmarks,
        totalUnread,
        todayReadCount
      });
    } catch (error) {
      // エラーハンドリング
    }
  })
  .patch("/:id/read", async (c) => {
    const id = parseInt(c.req.param("id"));
    const service = c.get("bookmarkService");
    
    try {
      await service.markBookmarkAsRead(id);
      return c.json({
        success: true,
        message: "Bookmark marked as read"
      });
    } catch (error) {
      // エラーハンドリング
    }
  });
  // お気に入り関連のルートは省略
```
