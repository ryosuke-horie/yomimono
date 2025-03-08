# ブックマーク自動分類機能 - データモデル設計

## データモデル拡張

自動分類機能を実装するために、既存のデータベーススキーマに以下の拡張が必要です。

```typescript
// 拡張されたブックマークスキーマ
export const bookmarks = sqliteTable("bookmarks", {
  // 既存のフィールド
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  title: text("title"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  
  // 新しいフィールド - 分類関連
  category: text("category"),  // メインカテゴリ
  subcategory: text("subcategory"),  // サブカテゴリ
  tags: text("tags"),  // カンマ区切りのタグリスト
  
  // 既存のタイムスタンプ
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
});

// カテゴリ情報管理用テーブル
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),  // カテゴリ名
  parentId: integer("parent_id").references(() => categories.id),  // 親カテゴリID（階層構造用）
  description: text("description"),  // カテゴリの説明
  count: integer("count").notNull().default(0),  // このカテゴリに属するブックマーク数
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
});
```

### 主な変更点

1. **ブックマークテーブルの拡張**
   - `category`: メインカテゴリ名を保存するフィールド
   - `subcategory`: サブカテゴリ名を保存するフィールド
   - `tags`: 関連キーワードやタグをカンマ区切りで保存するフィールド

2. **カテゴリテーブルの新規作成**
   - カテゴリの階層構造を管理するための専用テーブル
   - `parentId` による親子関係の表現（階層構造）
   - カテゴリごとのブックマーク数のカウント

### 設計上の考慮点

1. **階層構造**
   - `categories` テーブルの `parentId` を使用して、カテゴリの階層構造（メインカテゴリとサブカテゴリの関係）を表現
   - 最大2階層（メインカテゴリとサブカテゴリ）を想定した設計

2. **パフォーマンス最適化**
   - カテゴリごとのブックマーク数を `count` フィールドで事前集計しておくことで、UI表示時のクエリを効率化
   - カテゴリ操作時に `count` の値を更新するロジックが必要

3. **検索と絞り込み**
   - カテゴリやサブカテゴリによる効率的な検索のために、適切なインデックスを設定することを推奨

4. **拡張性**
   - 将来的に、より複雑なタグシステムやカテゴリ構造に拡張できるよう、テーブル構造を設計
