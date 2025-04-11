# 最近読んだ記事API設計

## API概要

最近読んだ記事一覧機能のAPIは、過去3日間に既読としてマークされたブックマークを取得し、日付ごとにグループ化して返却します。このAPIは既存のブックマークAPIの拡張として実装されています。

## エンドポイント詳細

### 最近読んだ記事取得API

```
GET /api/bookmarks/recent
```

#### リクエスト

認証やパラメータは不要です。

#### レスポンス

**成功時（200 OK）**

```json
{
  "success": true,
  "bookmarks": {
    "2025-04-11": [
      {
        "id": 1,
        "url": "https://example.com/article1",
        "title": "記事1のタイトル",
        "isRead": true,
        "isFavorite": false,
        "createdAt": "2025-04-10T10:30:00.000Z",
        "updatedAt": "2025-04-11T08:15:00.000Z"
      },
      // 同じ日付の他のブックマーク...
    ],
    "2025-04-10": [
      // 別の日付のブックマーク...
    ],
    // 他の日付...
  }
}
```

**エラー時（500 Internal Server Error）**

```json
{
  "success": false,
  "message": "Failed to fetch recently read bookmarks"
}
```

## 実装詳細

### リポジトリ層

`BookmarkRepository`インターフェースに`findRecentlyRead`メソッドを追加し、過去3日間に更新された既読ブックマークを取得します。

```typescript
// api/src/interfaces/repository/bookmark.ts
export interface BookmarkRepository {
  // 既存のメソッド...
  findRecentlyRead(): Promise<BookmarkWithFavorite[]>;
}

// api/src/repositories/bookmark.ts
async findRecentlyRead(): Promise<BookmarkWithFavorite[]> {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    // UTC+9の考慮
    threeDaysAgo.setHours(threeDaysAgo.getHours() - 9);

    const results = await this.db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.isRead, true),
          gte(bookmarks.updatedAt, threeDaysAgo),
        ),
      )
      .orderBy(bookmarks.updatedAt)
      .all();

    return this.attachFavoriteStatus(results);
  } catch (error) {
    console.error("Failed to fetch recently read bookmarks:", error);
    throw error;
  }
}
```

### サービス層

`BookmarkService`インターフェースに`getRecentlyReadBookmarks`メソッドを追加し、リポジトリから取得したデータを日付ごとにグループ化します。

```typescript
// api/src/interfaces/service/bookmark.ts
export interface BookmarkService {
  // 既存のメソッド...
  getRecentlyReadBookmarks(): Promise<{
    [date: string]: BookmarkWithFavorite[];
  }>;
}

// api/src/services/bookmark.ts
async getRecentlyReadBookmarks(): Promise<{
  [date: string]: BookmarkWithFavorite[];
}> {
  try {
    const bookmarks = await this.repository.findRecentlyRead();
    
    const groupedByDate: { [date: string]: BookmarkWithFavorite[] } = {};
    
    for (const bookmark of bookmarks) {
      const date = new Date(bookmark.updatedAt);
      date.setHours(date.getHours() + 9);
      
      const dateStr = date.toISOString().split("T")[0];
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = [];
      }
      
      groupedByDate[dateStr].push(bookmark);
    }
    
    return groupedByDate;
  } catch (error) {
    console.error("Failed to get recently read bookmarks:", error);
    throw new Error("Failed to get recently read bookmarks");
  }
}
```

### ルーター層

`bookmarks.ts`ルーターに新しいエンドポイントを追加します。

```typescript
// api/src/routes/bookmarks.ts
app.get("/recent", async (c) => {
  try {
    const recentlyReadBookmarks = await bookmarkService.getRecentlyReadBookmarks();
    return c.json({ success: true, bookmarks: recentlyReadBookmarks });
  } catch (error) {
    console.error("Failed to fetch recently read bookmarks:", error);
    return c.json(
      { success: false, message: "Failed to fetch recently read bookmarks" },
      500,
    );
  }
});
```

## エラーハンドリング

1. **データベースエラー**：
   - リポジトリ層でエラーをキャッチし、ログに記録した上で上位層に伝播
   - サービス層でエラーをキャッチし、適切なエラーメッセージに変換
   - ルーター層で最終的にエラーレスポンスを生成

2. **空のデータ**：
   - データが存在しない場合は空のオブジェクトを返却
   - フロントエンドで空のデータを適切に処理

## パフォーマンス考慮事項

1. **クエリの最適化**：
   - インデックスを活用した効率的なクエリ
   - 必要なデータのみを取得

2. **日付処理**：
   - タイムゾーン（UTC+9）を考慮した日付計算
   - 日付変換処理はサーバーサイドで実行し、クライアント負荷を軽減
