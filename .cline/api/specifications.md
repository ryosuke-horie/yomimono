# API仕様

## ブックマークエンドポイント

### POST /bookmarks
タブから収集したURLとタイトルを保存するエンドポイント

#### リクエスト仕様
```json
{
  "bookmarks": [
    {
      "url": "https://example.com",
      "title": "ページタイトル"
    }
  ]
}
```

#### 実装要件
- URLの重複チェック
- タイトルの必須チェック
- バルクインサートの利用
- エラー時の適切なステータスコード返却

### GET /bookmarks/unread
未読のブックマーク一覧を取得するエンドポイント

#### レスポンス仕様
```json
{
  "bookmarks": [
    {
      "id": "uuid",
      "url": "https://example.com",
      "title": "ページタイトル",
      "createdAt": "2024-03-02T10:00:00Z"
    }
  ]
}
```

## データベース設計

### bookmarksテーブル
```sql
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);
```

## エラーハンドリング

### エラーレスポンス形式
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "エラーの詳細メッセージ"
  }
}
```

### ステータスコード
- 200: 成功
- 400: リクエスト不正
- 409: 重複エラー
- 500: サーバーエラー

## 実装のベストプラクティス

### レイヤー構造
1. routes/
   - リクエストのバリデーション
   - レスポンスの整形
   - エラーハンドリング

2. services/
   - ビジネスロジックの実装
   - トランザクション管理
   - ドメインルールの適用

3. repositories/
   - データベースアクセス
   - クエリの最適化
   - データマッピング

### テスト戦略
- 各レイヤーの単体テスト
- エンドポイントの統合テスト
- エッジケースのカバー