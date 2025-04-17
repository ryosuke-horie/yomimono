# ラベル削除時の影響調査

## 背景
既読記事に対して関連づけられているラベルが削除された場合の影響について調査を行いました。
特にデータの整合性とユーザー体験への影響を中心に分析しています。

## DBスキーマ

### ER図

```mermaid
erDiagram
    bookmarks ||--o{ favorites : "has"
    bookmarks ||--o{ article_labels : "has"
    labels ||--o{ article_labels : "has"

    bookmarks {
        integer id PK
        text url
        text title
        boolean isRead
        timestamp createdAt
        timestamp updatedAt
    }

    favorites {
        integer id PK
        integer bookmark_id FK
        timestamp createdAt
    }

    labels {
        integer id PK
        text name
        timestamp createdAt
        timestamp updatedAt
    }

    article_labels {
        integer id PK
        integer article_id FK
        integer label_id FK
        timestamp createdAt
    }
}
```

### テーブル構成

#### bookmarks（記事）
- 主要テーブル：記事の基本情報を管理
- URL、タイトル、既読状態を保持
- 他テーブルから参照される親テーブル

#### labels（ラベル）
- ラベルのマスターデータを管理
- `name`カラムにUNIQUE制約あり
- 削除時に関連テーブルへの影響あり

#### article_labels（記事-ラベル紐付け）
- 記事とラベルのMany-to-Many関係を実現
- 両テーブルへの外部キー制約あり
- ラベル削除時にカスケード削除が発生

#### favorites（お気に入り）
- 記事のお気に入り状態を管理
- `bookmark_id`にUNIQUE制約あり

## ラベル削除時の影響

### 1. データ操作の影響

#### 確実に発生する変更
- `labels`テーブルから対象レコードが削除
- `article_labels`テーブルから関連レコードが自動削除（CASCADE）

#### 影響を受けないもの
- 記事本体（`bookmarks`テーブル）のデータ
- お気に入り設定（`favorites`テーブル）のデータ

### 2. 懸念される問題

#### データの永続性
- ラベル削除は取り消し不可能
- 関連付けの履歴が残らない
- 誤操作時のリカバリが困難

#### ユーザー体験への影響
- フィルタリング結果からの記事の突然の消失
- 記事の分類・整理機能の一時的な破綻
- ユーザーの意図しない表示変更

### 3. 特に注意が必要なケース
- 多数の記事で使用されているラベルの削除
- 重要な分類用ラベルの削除
- バッチ処理等による大量削除

## 改善提案

### 1. 削除前の警告機能
- 関連付けられている記事数の表示
- 影響を受ける記事の一覧表示
- 重要ラベルの場合の追加警告

### 2. 保護機能の実装
- 重要ラベルの削除保護
- 記事数に基づく削除制限
- 段階的な削除プロセス

### 3. 履歴管理の導入
- ラベル操作のログ記録
- 関連付け削除の履歴保持
- 一定期間の復元機能

## 結論
現状のDB設計は基本的な整合性を確保できていますが、ラベル削除時の安全性に課題があります。
特に、大量の記事に関連付けられたラベルの削除は、意図しない影響を及ぼす可能性が高いため、
上記の改善案を検討する必要があります。

## 今後のアクション
1. 削除前の警告機能の実装を優先的に検討
2. 重要ラベルの定義とその保護機能の設計
3. 操作履歴の管理方法の詳細設計
