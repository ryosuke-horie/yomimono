# Chrome拡張用 APIエンドポイント設計

## バルクブックマーク登録エンドポイント

### 基本情報
- エンドポイント: POST /api/bookmarks/bulk
- 用途: Chrome拡張機能からの複数URLの一括登録
- 処理: URLのメタデータ（タイトル）を取得してDBに保存

### リクエスト

```typescript
{
  urls: string[]  // 登録するURLの配列
}
```

### レスポンス

#### 成功時 (200 OK)
```typescript
{
  success: true
}
```

#### エラー時 (400/500)
```typescript
{
  success: false,
  message: string  // エラーメッセージ
}
```

### 処理フロー

1. リクエスト受信
   - URLsの配列を受け取り
   - 簡易的な形式チェック

2. 一括処理
   - 各URLに対して:
     - メタデータ取得
     - DB保存

3. レスポンス
   - 全て成功: `{ success: true }`
   - エラー発生: `{ success: false, message: "エラー内容" }`

### エラーケース
- 不正なリクエスト形式
- URLアクセスエラー
- DB保存エラー

### 制限事項
- 一度に処理可能なURL数: 最大10件
- 許可するURLスキーマ: http/https