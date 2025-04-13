# API設計

## エンドポイント一覧

### 1. 未ラベル記事一覧取得
```
GET /api/articles/unlabeled
```

#### リクエスト
- ヘッダー
  ```
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "articles": [
      {
        "id": 1,
        "url": "https://example.com",
        "title": "サンプルタイトル",
        "createdAt": "2024-04-04T12:00:00Z",
        "updatedAt": "2024-04-04T12:00:00Z"
      }
    ]
  }
  ```
- エラー時
  - 500: サーバーエラー
    ```json
    {
      "success": false,
      "message": "Failed to fetch unlabeled articles"
    }
    ```

### 2. ラベル一覧取得
```
GET /api/labels
```

#### リクエスト
- ヘッダー
  ```
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "labels": [
      {
        "id": 1,
        "name": "typescript",
        "articleCount": 5,
        "createdAt": "2024-04-04T12:00:00Z",
        "updatedAt": "2024-04-04T12:00:00Z"
      }
    ]
  }
  ```
- エラー時
  - 500: サーバーエラー
    ```json
    {
      "success": false,
      "message": "Failed to fetch labels"
    }
    ```

### 3. ラベル付与
```
PUT /api/articles/:id/label
```

#### リクエスト
- パラメータ
  - `id`: ラベルを付与する記事のID (数値)
- ボディ
  ```json
  {
    "labelName": "typescript"  // 既存のラベル名または新規ラベル名
  }
  ```
- ヘッダー
  ```
  Content-Type: application/json
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "label": {
      "id": 1,
      "name": "typescript",
      "createdAt": "2024-04-04T12:00:00Z",
      "updatedAt": "2024-04-04T12:00:00Z"
    }
  }
  ```
- エラー時
  - 400: 不正なリクエスト
    ```json
    {
      "success": false,
      "message": "Invalid request body"
    }
    ```
  - 404: 記事が存在しない
    ```json
    {
      "success": false,
      "message": "Article not found"
    }
    ```
  - 409: 既にラベル付与済み
    ```json
    {
      "success": false,
      "message": "Article is already labeled"
    }
    ```

### 4. ラベルによる記事フィルタリング
```
GET /api/articles?label=:labelName
```

#### リクエスト
- クエリパラメータ
  - `label`: フィルタリングするラベル名（URL encoded）
- ヘッダー
  ```
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "articles": [
      {
        "id": 1,
        "url": "https://example.com",
        "title": "サンプルタイトル",
        "label": {
          "id": 1,
          "name": "typescript"
        },
        "createdAt": "2024-04-04T12:00:00Z",
        "updatedAt": "2024-04-04T12:00:00Z"
      }
    ]
  }
  ```
- エラー時
  - 400: 不正なラベル名
    ```json
    {
      "success": false,
      "message": "Invalid label name"
    }
    ```

## 実装詳細

### 1. ルーティング実装（Hono）
```typescript
// 未ラベル記事一覧取得
app.get("/unlabeled", async (c) => {
  const result = await articleService.getUnlabeledArticles();
  return c.json({ success: true, articles: result });
});

// ラベル一覧取得
app.get("/labels", async (c) => {
  const result = await labelService.getLabels();
  return c.json({ success: true, labels: result });
});

// ラベル付与
app.put("/:id/label", async (c) => {
  const id = Number.parseInt(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ success: false, message: "Invalid article ID" }, 400);
  }

  const body = await c.req.json();
  if (!body.labelName || typeof body.labelName !== "string") {
    return c.json({ success: false, message: "Invalid request body" }, 400);
  }

  const result = await labelService.assignLabel(id, body.labelName);
  return c.json({ success: true, label: result });
});

// ラベルによる記事フィルタリング
app.get("/", async (c) => {
  const labelName = c.req.query("label");
  if (!labelName) {
    return c.json({ success: false, message: "Label name is required" }, 400);
  }

  const result = await articleService.getArticlesByLabel(labelName);
  return c.json({ success: true, articles: result });
});
```

### 2. エラーハンドリング

#### バリデーション
- リクエストボディの型チェック
  - labelName: 必須、文字列型
- パラメータの検証
  - 記事ID: 数値型
  - ラベル名: 文字列型、空文字でない

#### エラーレスポンス
- 400: リクエスト形式不正
- 404: リソースが存在しない
- 409: 重複操作
- 500: サーバーエラー

### 3. データ整形処理

#### ラベル名の正規化
```typescript
function normalizeLabel(name: string): string {
  return name
    .trim()                    // 前後の空白を除去
    .toLowerCase()             // 小文字に統一
    .replace(/[Ａ-Ｚａ-ｚ]/g,    // 全角英数を半角に変換
      (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}
```

#### レスポンスデータの整形
- 日時はISO 8601形式（UTC）で返却
- 不要なデータを除外
- 必要に応じて関連データを含める

### 4. セキュリティ対策

#### リクエストの検証
- Content-TypeとAcceptヘッダーのバリデーション
- パラメータの型チェックと値の検証
- 文字列の長さ制限とサニタイズ

#### エラー情報の制御
- スタックトレースは非公開
- エラーメッセージは適切な粒度で開示
