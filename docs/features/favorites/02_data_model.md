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
```

#### カラム説明

| カラム名 | 型 | 説明 |
|----------|------|------|
| id | INTEGER | 主キー、自動採番 |
| bookmark_id | INTEGER | ブックマークテーブルの外部キー |
| created_at | TIMESTAMP | お気に入り登録日時 |

#### 制約
- `bookmark_id`に`UNIQUE`制約を設定し、同じブックマークを重複してお気に入り登録できないようにする
- `FOREIGN KEY`制約により、ブックマークが削除された場合は関連するお気に入りも削除される

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

// TypeScript type for the favorites table
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;
```

## 型定義の更新

```typescript
// frontend/src/types/bookmark.ts
export interface Bookmark {
  id: number;
  url: string;
  title: string | null;
  isRead: boolean;
  isFavorite?: boolean; // お気に入り状態を表すフラグを追加
  createdAt: string;
  updatedAt: string;
}

// APIレスポンス型の定義
export interface FavoriteResponse {
  success: boolean;
  message?: string;
}

export interface FavoriteListResponse {
  success: boolean;
  bookmarks: Bookmark[];
  message?: string;
}
```

## データアクセスパターン

1. お気に入り登録
   - `favorites`テーブルに新しいレコードを作成
   - `bookmark_id`のユニーク制約により重複登録を防止

2. お気に入り解除
   - 指定された`bookmark_id`に対応するレコードを削除

3. お気に入り一覧取得
   - `bookmarks`テーブルと`favorites`テーブルを結合
   - お気に入りフラグ付きでブックマーク情報を取得

## マイグレーション

```sql
-- api/drizzle/xxxx_add_favorites_table.sql
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_favorites_bookmark_id ON favorites(bookmark_id);
