# API設計

## エンドポイント一覧

### 1. 未読ブックマーク一覧取得
```
GET /api/bookmarks
```

#### リクエスト
- クエリパラメータ（任意）
  - `label`: ラベル名を指定すると該当ブックマークのみ取得
- ヘッダー
  ```
  Accept: application/json
  ```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "bookmarks": [
      {
        "id": 1,
        "url": "https://example.com",
        "title": "サンプルタイトル",
        "labels": ["typescript"],
        "isRead": false,
        "isFavorite": false,
        "createdAt": "2024-04-04T12:00:00Z",
        "updatedAt": "2024-04-04T12:00:00Z"
      }
    ],
    "totalUnread": 42,
    "todayReadCount": 3
  }
  ```
- エラー時
  - 500: サーバーエラー
    ```json
    {
      "success": false,
      "message": "Failed to fetch bookmarks"
    }
    ```

### 2. 未ラベルブックマーク一覧取得
```
GET /api/bookmarks/unlabeled
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
    "bookmarks": [
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
      "message": "Failed to fetch unlabeled bookmarks"
    }
    ```

### 3. 単一ブックマークへのラベル付与
```
PUT /api/bookmarks/:id/label
```

#### リクエスト
- パスパラメータ
  - `id`: ラベル付与対象のブックマークID (数値)
- ボディ
  ```json
  {
    "labelName": "typescript",
    "description": "TypeScript関連記事"
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
      "id": 10,
      "name": "typescript",
      "description": "TypeScript関連記事",
      "createdAt": "2024-04-04T12:00:00Z",
      "updatedAt": "2024-04-04T12:00:00Z"
    }
  }
  ```
- エラー時
  - 400: パラメータ不正
    ```json
    {
      "success": false,
      "message": "Invalid request body"
    }
    ```
  - 404: ブックマーク未存在
    ```json
    {
      "success": false,
      "message": "Bookmark not found"
    }
    ```
  - 409: すでにラベル付与済み
    ```json
    {
      "success": false,
      "message": "Bookmark is already labeled"
    }
    ```

### 4. 複数ブックマークへの一括ラベル付与
```
PUT /api/bookmarks/batch-label
```

#### リクエスト
- ボディ
  ```json
  {
    "articleIds": [1, 2, 3],
    "labelName": "typescript",
    "description": "TypeScript関連記事"
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
    "successful": 2,
    "skipped": 1,
    "errors": [
      {
        "articleId": 3,
        "error": "Bookmark is already labeled"
      }
    ],
    "label": {
      "id": 10,
      "name": "typescript",
      "description": "TypeScript関連記事"
    }
  }
  ```
- エラー時
  - 400: パラメータ不正
    ```json
    {
      "success": false,
      "message": "articleIds must be a non-empty array"
    }
    ```
  - 500: サーバーエラー
    ```json
    {
      "success": false,
      "message": "Failed to batch assign labels"
    }
    ```

### 5. ラベル一覧取得
```
GET /api/labels
```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "labels": [
      {
        "id": 10,
        "name": "typescript",
        "description": "TypeScript関連記事",
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
      "message": "Failed to get labels"
    }
    ```

### 6. ラベル詳細取得
```
GET /api/labels/:id
```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "label": {
      "id": 10,
      "name": "typescript",
      "description": "TypeScript関連記事",
      "createdAt": "2024-04-04T12:00:00Z",
      "updatedAt": "2024-04-04T12:00:00Z"
    }
  }
  ```
- エラー時
  - 404: 指定IDのラベルが存在しない
    ```json
    {
      "success": false,
      "message": "Label not found"
    }
    ```

### 7. 未使用ラベルのクリーンアップ
```
DELETE /api/labels/cleanup
```

#### レスポンス
- 成功時 (200 OK)
  ```json
  {
    "success": true,
    "message": "Successfully cleaned up 3 unused labels",
    "deletedCount": 3,
    "deletedLabels": [
      { "id": 21, "name": "old-label" }
    ]
  }
  ```
- エラー時
  - 500: サーバーエラー
    ```json
    {
      "success": false,
      "message": "Failed to cleanup unused labels"
    }
    ```

## 実装メモ

- エンドポイントはすべてJSONレスポンスを返却し、`success`フラグで成否を判定する。
- ラベル名・説明文はサービス層で正規化・バリデーションされる。
- `articleIds` は正の整数配列であることを必須とし、空配列は400エラーを返す。
- 未読ブックマーク取得時は `totalUnread` と `todayReadCount` を併せて返すため、クライアント側でダッシュボード表示に利用できる。
