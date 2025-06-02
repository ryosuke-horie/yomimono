# 記事評価ポイント機能 - API設計

## 1. API エンドポイント一覧

### 1.1 記事評価関連エンドポイント

| メソッド | エンドポイント | 機能 | 認証 |
|---------|---------------|------|------|
| `POST` | `/api/bookmarks/{id}/rating` | 記事に評価を追加 | 不要 |
| `GET` | `/api/bookmarks/{id}/rating` | 記事の評価を取得 | 不要 |
| `PATCH` | `/api/bookmarks/{id}/rating` | 記事の評価を更新 | 不要 |
| `DELETE` | `/api/bookmarks/{id}/rating` | 記事の評価を削除 | 不要 |
| `GET` | `/api/ratings` | 評価一覧を取得 | 不要 |
| `GET` | `/api/ratings/stats` | 評価統計情報を取得 | 不要 |

## 2. エンドポイント詳細設計

### 2.1 POST /api/bookmarks/{id}/rating (評価作成)

#### リクエスト
```typescript
// パスパラメータ
{
  id: number  // 記事ID
}

// リクエストボディ
{
  practicalValue: number,    // 実用性 (1-10)
  technicalDepth: number,    // 技術深度 (1-10)
  understanding: number,     // 理解度 (1-10)
  novelty: number,          // 新規性 (1-10)
  importance: number,       // 重要度 (1-10)
  comment?: string          // コメント (最大1000文字)
}
```

#### レスポンス
```typescript
// 成功時 (201 Created)
{
  success: true,
  rating: {
    id: number,
    articleId: number,
    practicalValue: number,
    technicalDepth: number,
    understanding: number,
    novelty: number,
    importance: number,
    totalScore: number,      // 自動計算された総合スコア
    comment?: string,
    createdAt: string,       // ISO 8601 format
    updatedAt: string
  },
  message: "記事の評価を作成しました"
}

// エラー時
{
  success: false,
  message: string,
  details?: object
}
```

#### エラーコード
- `400 Bad Request`: 不正なリクエストデータ
- `404 Not Found`: 記事が存在しない
- `409 Conflict`: 評価が既に存在する
- `422 Unprocessable Entity`: バリデーションエラー

### 2.2 GET /api/bookmarks/{id}/rating (評価取得)

#### リクエスト
```typescript
// パスパラメータ
{
  id: number  // 記事ID
}
```

#### レスポンス
```typescript
// 成功時 (200 OK)
{
  success: true,
  rating: {
    id: number,
    articleId: number,
    practicalValue: number,
    technicalDepth: number,
    understanding: number,
    novelty: number,
    importance: number,
    totalScore: number,
    comment?: string,
    createdAt: string,
    updatedAt: string
  }
}

// 評価が存在しない場合 (404 Not Found)
{
  success: false,
  message: "この記事の評価は存在しません"
}
```

### 2.3 PATCH /api/bookmarks/{id}/rating (評価更新)

#### リクエスト
```typescript
// パスパラメータ
{
  id: number  // 記事ID
}

// リクエストボディ (部分更新可能)
{
  practicalValue?: number,
  technicalDepth?: number,
  understanding?: number,
  novelty?: number,
  importance?: number,
  comment?: string
}
```

#### レスポンス
```typescript
// 成功時 (200 OK)
{
  success: true,
  rating: {
    // 更新後の評価データ
    id: number,
    articleId: number,
    practicalValue: number,
    technicalDepth: number,
    understanding: number,
    novelty: number,
    importance: number,
    totalScore: number,      // 再計算された総合スコア
    comment?: string,
    createdAt: string,
    updatedAt: string        // 更新日時が新しくなる
  },
  message: "記事の評価を更新しました"
}
```

### 2.4 GET /api/ratings (評価一覧取得)

#### リクエスト
```typescript
// クエリパラメータ
{
  sortBy?: 'totalScore' | 'createdAt' | 'practicalValue' | 'technicalDepth' | 'understanding' | 'novelty' | 'importance',
  order?: 'asc' | 'desc',
  limit?: number,          // 1-100, default: 20
  offset?: number,         // default: 0
  minScore?: number,       // 1.0-10.0
  maxScore?: number,       // 1.0-10.0
  hasComment?: boolean     // コメント有無でフィルター
}
```

#### レスポンス
```typescript
// 成功時 (200 OK)
{
  success: true,
  ratings: [
    {
      id: number,
      articleId: number,
      practicalValue: number,
      technicalDepth: number,
      understanding: number,
      novelty: number,
      importance: number,
      totalScore: number,
      comment?: string,
      createdAt: string,
      updatedAt: string,
      // 記事情報も含める
      article: {
        id: number,
        title: string,
        url: string,
        createdAt: string
      }
    }
  ],
  total: number,           // 総件数
  page: number,            // 現在のページ (offset/limit + 1)
  limit: number,           // 1ページあたりの件数
  hasNext: boolean         // 次のページが存在するか
}
```

### 2.5 GET /api/ratings/stats (評価統計情報)

#### リクエスト
```typescript
// クエリパラメータ
{
  period?: 'week' | 'month' | 'year' | 'all',  // 集計期間, default: 'all'
  groupBy?: 'score' | 'dimension'              // グループ化方法
}
```

#### レスポンス
```typescript
// 成功時 (200 OK)
{
  success: true,
  stats: {
    totalRatings: number,
    averageScore: number,
    medianScore: number,
    scoreDistribution: [
      {
        range: '1.0-2.0',
        count: number,
        percentage: number
      }
      // ... 他の範囲
    ],
    dimensionAverages: {
      practicalValue: number,
      technicalDepth: number,
      understanding: number,
      novelty: number,
      importance: number
    },
    topRatedArticles: [
      {
        articleId: number,
        title: string,
        totalScore: number,
        createdAt: string
      }
    ],
    recentActivity: {
      thisWeek: number,
      thisMonth: number,
      lastRatingDate: string
    }
  }
}
```

## 3. データベース設計との対応

### 3.1 SQLクエリ例

```sql
-- 評価作成
INSERT INTO article_ratings (
  article_id, practical_value, technical_depth, 
  understanding, novelty, importance, comment
) VALUES (?, ?, ?, ?, ?, ?, ?);

-- 評価一覧取得（記事情報含む）
SELECT 
  ar.*,
  b.title as article_title,
  b.url as article_url,
  b.created_at as article_created_at
FROM article_ratings ar
JOIN bookmarks b ON ar.article_id = b.id
ORDER BY ar.total_score DESC
LIMIT ? OFFSET ?;

-- 統計情報取得
SELECT 
  COUNT(*) as total_ratings,
  AVG(total_score) as average_score,
  AVG(practical_value) as avg_practical,
  AVG(technical_depth) as avg_technical,
  AVG(understanding) as avg_understanding,
  AVG(novelty) as avg_novelty,
  AVG(importance) as avg_importance
FROM article_ratings;
```

## 4. バリデーション設計

### 4.1 リクエストバリデーション

```typescript
// Zod スキーマ例
const CreateRatingSchema = z.object({
  practicalValue: z.number().int().min(1).max(10),
  technicalDepth: z.number().int().min(1).max(10),
  understanding: z.number().int().min(1).max(10),
  novelty: z.number().int().min(1).max(10),
  importance: z.number().int().min(1).max(10),
  comment: z.string().max(1000).optional()
});

const UpdateRatingSchema = z.object({
  practicalValue: z.number().int().min(1).max(10).optional(),
  technicalDepth: z.number().int().min(1).max(10).optional(),
  understanding: z.number().int().min(1).max(10).optional(),
  novelty: z.number().int().min(1).max(10).optional(),
  importance: z.number().int().min(1).max(10).optional(),
  comment: z.string().max(1000).optional()
});

const GetRatingsQuerySchema = z.object({
  sortBy: z.enum(['totalScore', 'createdAt', 'practicalValue', 'technicalDepth', 'understanding', 'novelty', 'importance']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  minScore: z.number().min(1).max(10).optional(),
  maxScore: z.number().min(1).max(10).optional(),
  hasComment: z.boolean().optional()
});
```

### 4.2 カスタムバリデーション

```typescript
// 記事存在確認
async function validateArticleExists(articleId: number): Promise<boolean> {
  const article = await getBookmarkById(articleId);
  return !!article;
}

// 評価重複チェック
async function validateRatingNotExists(articleId: number): Promise<boolean> {
  try {
    await getRatingByArticleId(articleId);
    return false; // 既に存在する
  } catch {
    return true;  // 存在しない（作成可能）
  }
}

// スコア範囲チェック
function validateScoreRange(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 10;
}
```

## 5. エラーハンドリング戦略

### 5.1 エラーレスポンス統一形式

```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: {
    field?: string;
    value?: any;
    constraint?: string;
  };
  timestamp: string;
}
```

### 5.2 エラーコードマッピング

```typescript
const ERROR_CODES = {
  ARTICLE_NOT_FOUND: 'E001',
  RATING_ALREADY_EXISTS: 'E002', 
  INVALID_SCORE_RANGE: 'E003',
  RATING_NOT_FOUND: 'E004',
  VALIDATION_ERROR: 'E005',
  DATABASE_ERROR: 'E006'
} as const;
```

## 6. セキュリティ考慮事項

### 6.1 入力サニタイゼーション

- SQLインジェクション対策: パラメータ化クエリ使用
- XSS対策: コメント文字列のエスケープ
- 入力値制限: 評価値の範囲チェック、文字列長制限

### 6.2 レート制限

```typescript
// 将来的な実装候補
const RATE_LIMITS = {
  CREATE_RATING: '10 requests per minute',
  UPDATE_RATING: '30 requests per minute', 
  GET_RATINGS: '100 requests per minute'
};
```

## 7. パフォーマンス最適化

### 7.1 インデックス戦略

```sql
-- 既定義のインデックス（03_データモデル.md参照）
CREATE INDEX idx_article_ratings_article_id ON article_ratings(article_id);
CREATE INDEX idx_article_ratings_total_score ON article_ratings(total_score);
CREATE INDEX idx_article_ratings_created_at ON article_ratings(created_at);

-- 追加検討インデックス
CREATE INDEX idx_article_ratings_composite_score_date ON article_ratings(total_score DESC, created_at DESC);
```

### 7.2 キャッシュ戦略

- 統計情報: 1時間キャッシュ
- 評価一覧: 5分キャッシュ
- 個別評価: リアルタイム取得（キャッシュなし）