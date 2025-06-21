# パフォーマンス最適化インデックス設計書

## 概要
このドキュメントは、データベースのJOINパフォーマンス最適化のために追加されたインデックスについて説明します。
マイグレーション `0001_luxuriant_silvermane.sql` で実装された各インデックスの目的と効果を記載しています。

## 実装されたインデックス

### 1. bookmarksテーブルのインデックス

#### `idx_bookmarks_is_read`
```sql
CREATE INDEX idx_bookmarks_is_read ON bookmarks (is_read);
```
**目的**: 未読/既読フィルタリングの高速化  
**効果**: `WHERE is_read = false` や `WHERE is_read = true` のクエリが高速化される  
**対象クエリ**: 未読記事一覧取得、既読記事一覧取得

#### `idx_bookmarks_created_at`
```sql
CREATE INDEX idx_bookmarks_created_at ON bookmarks (created_at);
```
**目的**: 作成日時での並び替えの高速化  
**効果**: `ORDER BY created_at DESC` のクエリが高速化される  
**対象クエリ**: 記事の新着順表示

#### `idx_bookmarks_is_read_created_at` (複合インデックス)
```sql
CREATE INDEX idx_bookmarks_is_read_created_at ON bookmarks (is_read, created_at);
```
**目的**: 最も一般的な未読記事取得パターンの最適化  
**効果**: `WHERE is_read = false ORDER BY created_at DESC` のクエリが最高効率で実行される  
**対象クエリ**: 未読記事の新着順一覧（アプリケーションの主要機能）

### 2. article_labelsテーブルのインデックス

#### `idx_article_labels_article_id`
```sql
CREATE INDEX idx_article_labels_article_id ON article_labels (article_id);
```
**目的**: bookmarksテーブルとのJOIN最適化（最重要）  
**効果**: `bookmarks b LEFT JOIN article_labels al ON b.id = al.article_id` のJOINが高速化される  
**対象クエリ**: 記事にラベル情報を付与して取得するすべてのクエリ

#### `idx_article_labels_label_id`
```sql
CREATE INDEX idx_article_labels_label_id ON article_labels (label_id);
```
**目的**: labelsテーブルとのJOIN最適化  
**効果**: `article_labels al JOIN labels l ON al.label_id = l.id` のJOINが高速化される  
**対象クエリ**: ラベル情報の詳細を含む記事取得

#### `idx_article_labels_article_label` (複合インデックス)
```sql
CREATE INDEX idx_article_labels_article_label ON article_labels (article_id, label_id);
```
**目的**: 記事-ラベルペアの一意性確認とJOIN最適化  
**効果**: 
- 特定の記事に特定のラベルが付いているかの確認が高速化
- 記事-ラベルの複合条件でのフィルタリングが高速化  
**対象クエリ**: ラベルフィルタリング、重複チェック

## パフォーマンス改善予測

### 改善前の問題
1. **Full Table Scan**: インデックスなしでは全レコードを走査
2. **JOIN効率の悪化**: 外部キー関係のJOINが非効率
3. **ソート処理の重さ**: ORDER BYが毎回ソート処理を実行

### 改善後の効果
1. **インデックススキャン**: O(log n)での高速検索
2. **効率的なJOIN**: インデックスを利用したネステッドループJOIN
3. **ソート済みデータ**: インデックス順序を利用した高速ソート

### 想定パフォーマンス向上
- **小規模データ（～1,000件）**: 2-3倍の高速化
- **中規模データ（～10,000件）**: 5-10倍の高速化  
- **大規模データ（10,000件～）**: 10-100倍の高速化

## 対象クエリパターン

### 1. 未読記事一覧取得（最重要）
```sql
SELECT b.*, l.name as label_name
FROM bookmarks b
LEFT JOIN article_labels al ON b.id = al.article_id
LEFT JOIN labels l ON al.label_id = l.id
WHERE b.is_read = false
ORDER BY b.created_at DESC;
```
**利用インデックス**: `idx_bookmarks_is_read_created_at`, `idx_article_labels_article_id`

### 2. ラベル付き記事フィルタリング
```sql
SELECT b.*
FROM bookmarks b
JOIN article_labels al ON b.id = al.article_id
WHERE al.label_id = ?
ORDER BY b.created_at DESC;
```
**利用インデックス**: `idx_article_labels_label_id`, `idx_bookmarks_created_at`

### 3. 特定記事のラベル情報取得
```sql
SELECT l.*
FROM labels l
JOIN article_labels al ON l.id = al.label_id
WHERE al.article_id = ?;
```
**利用インデックス**: `idx_article_labels_article_id`

## データベース互換性

### SQLite（開発環境）
- すべてのインデックス記法が完全サポート
- パーティャルインデックスやカバリングインデックスも利用可能

### Cloudflare D1（本番環境）
- SQLiteベースのため同一の機能をサポート
- インデックス作成・利用において制限なし
- 自動的なクエリ最適化が有効

## 運用時の考慮事項

### インデックスのメンテナンス
- **自動更新**: INSERT/UPDATE/DELETE時に自動的に更新される
- **領域使用量**: 全インデックス合計でデータサイズの10-15%程度の追加領域
- **書き込み性能**: わずかな書き込み性能の低下（読み取り性能向上と比較して微小）

### 監視ポイント
- クエリ実行時間の変化
- インデックス使用率の確認
- データベースサイズの変化

## 今後の拡張性

### 追加検討可能なインデックス
1. **URL一意性チェック用**: `CREATE UNIQUE INDEX idx_bookmarks_url ON bookmarks (url);`
2. **タイトル検索用**: `CREATE INDEX idx_bookmarks_title ON bookmarks (title);`
3. **ラベル名検索用**: 既存の `labels_name_unique` で対応済み

### パーティャルインデックス（必要に応じて）
```sql
-- 未読記事のみのインデックス（さらなる最適化）
CREATE INDEX idx_bookmarks_unread_created_at 
ON bookmarks (created_at) 
WHERE is_read = false;
```

## まとめ
この最適化により、アプリケーションの主要機能である未読記事一覧の表示が大幅に高速化され、
ユーザー体験の向上とサーバー負荷の軽減を実現します。