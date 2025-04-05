# データモデル設計

## テーブル定義

### favoritesテーブル

```sql
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE UNIQUE INDEX idx_favorites_bookmark_id ON favorites(bookmark_id);
```

#### カラム説明

| カラム名 | 型 | 説明 | 制約 |
|----------|------|------|------|
| id | INTEGER | お気に入りレコードの一意識別子 | PRIMARY KEY, AUTOINCREMENT |
| bookmark_id | INTEGER | 対象のブックマークID | NOT NULL, UNIQUE, 外部キー |
| created_at | TIMESTAMP | お気に入り登録日時 | NOT NULL, デフォルト値: 現在時刻 |

#### 制約
- `bookmark_id`に`UNIQUE`制約：同じブックマークの重複登録を防止
- 外部キー制約（CASCADE）：ブックマーク削除時に関連するお気に入りも自動削除

## Drizzle Schema定義

```typescript
// api/src/db/schema.ts
export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookmarkId: integer("bookmark_id")
    .notNull()
    .unique()
    .references(() => bookmarks.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

// 型定義
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;
```

## 型定義

### バックエンド

```typescript
// お気に入り関連の型定義
export interface Favorite {
  id: number;
  bookmarkId: number;
  createdAt: Date;
}

// ブックマークの拡張型（お気に入り状態を含む）
export type BookmarkWithFavorite = Bookmark & { isFavorite: boolean };
```

### フロントエンド

```typescript
// ブックマークの型定義を拡張
export interface Bookmark {
  id: number;
  url: string;
  title: string | null;
  isRead: boolean;
  isFavorite: boolean; // お気に入り状態を追加
  createdAt: string;
  updatedAt: string;
}

// APIレスポンスの型定義
export interface ApiBookmarkResponse {
  success: boolean;
  bookmarks?: Bookmark[];
  message?: string;
}

export interface ApiFavoriteResponse extends ApiBookmarkResponse {
  bookmarks: Bookmark[];
}
```

## データアクセスパターン

1. お気に入り登録
   ```typescript
   await db.insert(favorites).values({ bookmarkId, createdAt: new Date() });
   ```

2. お気に入り解除
   ```typescript
   await db
     .delete(favorites)
     .where(eq(favorites.bookmarkId, bookmarkId));
   ```

3. お気に入り一覧取得
   ```typescript
   const results = await db
     .select()
     .from(bookmarks)
     .innerJoin(favorites, eq(bookmarks.id, favorites.bookmarkId));
   ```

4. お気に入り状態の確認
   ```typescript
   const result = await db
     .select()
     .from(favorites)
     .where(eq(favorites.bookmarkId, bookmarkId))
     .get();
