# 本棚機能設計書

## 概要
通常の技術記事とは別に、本・GitHub リポジトリ・PDF（論文）など、読むのに数時間以上を要する骨のある読み物を管理する「本棚」機能を実装する。

## 背景と目的

### 現状の課題
- 現在のブックマーク機能は短時間で読める技術記事に最適化されている
- 長編コンテンツ（本、論文、大規模リポジトリ）の管理には不向き
- 読書進捗の管理ができない
- コンテンツの種類に応じた整理ができない

### 目的
- 長時間かけて読むコンテンツの専用管理場所を提供
- 読書進捗の可視化
- コンテンツタイプ別の整理・検索機能
- 読書計画の立案支援

## 機能要件

### 1. コンテンツタイプ
以下の種類のコンテンツを管理可能にする：

| タイプ | 説明 | メタデータ |
|--------|------|------------|
| 📚 書籍 | 技術書、ビジネス書など | ISBN、著者、出版社、ページ数 |
| 📄 PDF/論文 | 学術論文、技術文書 | 著者、発行年、ページ数、DOI |
| 🐙 GitHubリポジトリ | ソースコード、ドキュメント | スター数、言語、最終更新日 |
| 📖 Zenn Book | Zennの本形式コンテンツ | 著者、章数、推定読了時間 |
| 🎓 オンラインコース | Udemy、Courseraなど | 講師、時間、プラットフォーム |

### 2. ステータス管理

```typescript
enum ReadingStatus {
  WANT_TO_READ = "want_to_read",    // 読みたい
  READING = "reading",               // 読書中
  COMPLETED = "completed",           // 読了
  ON_HOLD = "on_hold",              // 一時中断
  REFERENCE = "reference"            // 参考資料（辞書的に使う）
}
```

### 3. 進捗管理
- ページ数ベース（書籍、PDF）
- チャプター/セクションベース（Zenn Book、オンラインコース）
- ファイル/ディレクトリベース（GitHubリポジトリ）
- 読書メモ機能

### 4. 整理・分類機能
- カテゴリー分類（フロントエンド、バックエンド、インフラ、etc）
- タグ付け機能
- 優先度設定（高・中・低）
- 読書リスト作成機能

## データモデル

### booksテーブル
```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'book', 'pdf', 'github', 'zenn', 'course'
  title TEXT NOT NULL,
  url TEXT,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'want_to_read',
  priority INTEGER DEFAULT 2, -- 1:高, 2:中, 3:低
  total_pages INTEGER,
  current_page INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  estimated_hours REAL, -- 推定読了時間
  actual_hours REAL, -- 実際にかかった時間
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT, -- 読書メモ
  metadata TEXT, -- JSON形式で追加情報を保存
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### book_tagsテーブル
```sql
CREATE TABLE book_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE(book_id, tag_name)
);
```

### reading_sessionsテーブル（読書セッション記録）
```sql
CREATE TABLE reading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  start_page INTEGER,
  end_page INTEGER,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
```

### reading_listsテーブル（読書リスト）
```sql
CREATE TABLE reading_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reading_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE(list_id, book_id)
);
```

## API設計

### エンドポイント一覧

#### 本棚管理
- `GET /api/bookshelf` - 本棚の一覧取得
- `POST /api/bookshelf` - 本を追加
- `GET /api/bookshelf/:id` - 本の詳細取得
- `PUT /api/bookshelf/:id` - 本の情報更新
- `DELETE /api/bookshelf/:id` - 本を削除
- `PATCH /api/bookshelf/:id/status` - ステータス更新
- `PATCH /api/bookshelf/:id/progress` - 進捗更新

#### 読書セッション
- `POST /api/bookshelf/:id/sessions` - 読書セッション記録
- `GET /api/bookshelf/:id/sessions` - 読書履歴取得

#### 読書リスト
- `GET /api/reading-lists` - リスト一覧取得
- `POST /api/reading-lists` - リスト作成
- `PUT /api/reading-lists/:id` - リスト更新
- `DELETE /api/reading-lists/:id` - リスト削除
- `POST /api/reading-lists/:id/items` - 本をリストに追加
- `DELETE /api/reading-lists/:id/items/:bookId` - 本をリストから削除

#### 統計・分析
- `GET /api/bookshelf/stats` - 読書統計取得
- `GET /api/bookshelf/recommendations` - おすすめ本の取得

## UI/UX設計

### 1. 本棚ページレイアウト

```
┌─────────────────────────────────────────────┐
│  📚 私の本棚                                │
├─────────────────────────────────────────────┤
│ [フィルター]                                 │
│ ・タイプ: [全て][書籍][PDF][GitHub][Zenn]   │
│ ・ステータス: [全て][読みたい][読書中][読了] │
│ ・タグ: [タグ選択]                          │
│ ・並び順: [優先度順][追加日順][進捗順]      │
├─────────────────────────────────────────────┤
│ 📊 読書統計                                  │
│ ・今月の読了: 3冊                           │
│ ・読書中: 5冊                               │
│ ・総読書時間: 42時間                        │
├─────────────────────────────────────────────┤
│ [本棚ビュー] [リストビュー] [カードビュー]   │
│                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│ │  📚     │ │  📄     │ │  🐙     │      │
│ │ Book 1  │ │ PDF 1   │ │ Repo 1  │      │
│ │ 70%     │ │ 30%     │ │ 未読    │      │
│ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────┘
```

### 2. 本の詳細ページ

```
┌─────────────────────────────────────────────┐
│  📚 [本のタイトル]                          │
├─────────────────────────────────────────────┤
│ 基本情報:                                   │
│ ・著者: [著者名]                            │
│ ・タイプ: 書籍                              │
│ ・ページ数: 350ページ                       │
│ ・推定読了時間: 10時間                      │
├─────────────────────────────────────────────┤
│ 読書進捗:                                   │
│ [==========>          ] 45% (158/350)       │
│                                             │
│ ステータス: [読書中 ▼]                      │
│ 優先度: [高 ▼]                              │
├─────────────────────────────────────────────┤
│ 読書メモ:                                   │
│ [メモ入力エリア]                            │
│                                             │
├─────────────────────────────────────────────┤
│ 読書履歴:                                   │
│ ・2024/08/01 - 30分 (p.1-25)               │
│ ・2024/08/02 - 45分 (p.26-60)              │
└─────────────────────────────────────────────┘
```

### 3. 本の追加フォーム

```typescript
interface BookAddForm {
  type: BookType;
  title: string;
  url?: string;
  author?: string;
  totalPages?: number;
  estimatedHours?: number;
  tags: string[];
  priority: Priority;
  notes?: string;
}
```

## 実装計画

### Phase 1: 基盤構築（MVP）
1. データベーススキーマの作成
2. 基本的なCRUD API実装
3. シンプルな本棚ページUI
4. 本の追加・編集・削除機能

### Phase 2: 進捗管理機能
1. 読書進捗の更新機能
2. 読書セッションの記録
3. 進捗バーの表示
4. ステータス管理

### Phase 3: 整理・分類機能
1. タグ機能の実装
2. フィルター・検索機能
3. 読書リスト機能
4. 並び替え機能

### Phase 4: 統計・分析機能
1. 読書統計ダッシュボード
2. 読書履歴の可視化
3. 推薦機能
4. エクスポート機能

## 技術的考慮事項

### 1. 既存システムとの統合
- 現在のブックマーク機能とは独立して実装
- 将来的に相互参照可能にする（記事から本への昇格など）
- 共通のタグシステムを利用

### 2. パフォーマンス
- 大量の本を管理してもパフォーマンスが劣化しないようインデックス設計
- 画像（本の表紙）を扱う場合はCDN利用を検討
- ページネーション実装

### 3. 外部API連携（将来的な拡張）
- Google Books API - ISBN検索、書籍情報取得
- GitHub API - リポジトリ情報の自動取得
- OpenLibrary API - 書籍メタデータ取得

### 4. Chrome拡張機能との連携
- 現在開いているGitHubリポジトリを本棚に追加
- PDFファイルのURLを本棚に追加
- Zenn Bookを本棚に追加

## 成功指標

1. **利用率**: アクティブユーザーの50%以上が本棚機能を利用
2. **継続率**: 本棚に追加した本の30%以上で進捗更新が行われる
3. **完了率**: 「読書中」ステータスの本の20%以上が「読了」に移行
4. **満足度**: ユーザーフィードバックで有用性評価4.0以上/5.0

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 機能の複雑化 | 高 | MVPから段階的に実装 |
| 既存機能との混同 | 中 | UIで明確に区別 |
| データ移行の必要性 | 低 | 独立したテーブル設計 |

## まとめ

本棚機能は、長編コンテンツの管理に特化した新機能として、既存のブックマーク機能を補完する位置づけで実装する。段階的な実装により、ユーザーフィードバックを取り入れながら機能を成熟させていく。