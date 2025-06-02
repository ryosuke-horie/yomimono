# 記事評価ポイント機能 - MCP設計

## 1. MCPサーバー拡張概要

既存の `EffectiveYomimonoLabeler` MCPサーバーに記事評価機能を追加します。

### 1.1 新規追加ツール一覧

| ツール名 | 機能 | 優先度 |
|---------|------|--------|
| `rateArticle` | 記事に評価を追加 | 高 |
| `getArticleRating` | 記事の評価を取得 | 高 |
| `updateArticleRating` | 記事の評価を更新 | 高 |
| `getArticleRatings` | 評価一覧を取得（ソート・フィルター対応） | 中 |
| `getRatingStats` | 評価統計情報を取得 | 低 |
| `getTopRatedArticles` | 高評価記事一覧を取得 | 低 |

## 2. ツール詳細設計

### 2.1 rateArticle (記事評価追加)

```typescript
server.tool(
  "rateArticle",
  {
    articleId: z.number().int().positive(),
    practicalValue: z.number().int().min(1).max(10),
    technicalDepth: z.number().int().min(1).max(10),
    understanding: z.number().int().min(1).max(10),
    novelty: z.number().int().min(1).max(10),
    importance: z.number().int().min(1).max(10),
    comment: z.string().max(1000).optional()
  },
  async ({ articleId, practicalValue, technicalDepth, understanding, novelty, importance, comment }) => {
    try {
      const rating = await apiClient.createArticleRating({
        articleId,
        practicalValue,
        technicalDepth,
        understanding,
        novelty,
        importance,
        comment
      });
      
      return {
        content: [{
          type: "text",
          text: `記事ID ${articleId} に評価を追加しました。\n総合スコア: ${rating.totalScore}/10\n\n評価詳細:\n- 実用性: ${practicalValue}/10\n- 技術深度: ${technicalDepth}/10\n- 理解度: ${understanding}/10\n- 新規性: ${novelty}/10\n- 重要度: ${importance}/10${comment ? `\n- コメント: ${comment}` : ''}`
        }],
        isError: false
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text", 
          text: `記事の評価追加に失敗しました: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);
```

### 2.2 getArticleRating (記事評価取得)

```typescript
server.tool(
  "getArticleRating",
  {
    articleId: z.number().int().positive()
  },
  async ({ articleId }) => {
    try {
      const rating = await apiClient.getArticleRating(articleId);
      
      return {
        content: [{
          type: "text",
          text: `記事ID ${articleId} の評価:\n\n総合スコア: ${rating.totalScore}/10 ⭐\n\n評価詳細:\n- 実用性: ${rating.practicalValue}/10\n- 技術深度: ${rating.technicalDepth}/10\n- 理解度: ${rating.understanding}/10\n- 新規性: ${rating.novelty}/10\n- 重要度: ${rating.importance}/10\n\n評価日: ${new Date(rating.createdAt).toLocaleDateString('ja-JP')}${rating.comment ? `\nコメント: ${rating.comment}` : ''}`
        }],
        isError: false
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `記事の評価取得に失敗しました: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);
```

### 2.3 updateArticleRating (記事評価更新)

```typescript
server.tool(
  "updateArticleRating",
  {
    articleId: z.number().int().positive(),
    practicalValue: z.number().int().min(1).max(10).optional(),
    technicalDepth: z.number().int().min(1).max(10).optional(),
    understanding: z.number().int().min(1).max(10).optional(),
    novelty: z.number().int().min(1).max(10).optional(),
    importance: z.number().int().min(1).max(10).optional(),
    comment: z.string().max(1000).optional()
  },
  async ({ articleId, ...updates }) => {
    try {
      const rating = await apiClient.updateArticleRating(articleId, updates);
      
      const updatedFields = Object.entries(updates)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');
      
      return {
        content: [{
          type: "text",
          text: `記事ID ${articleId} の評価を更新しました。\n\n更新内容:\n${updatedFields}\n\n新しい総合スコア: ${rating.totalScore}/10`
        }],
        isError: false
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `記事の評価更新に失敗しました: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);
```

### 2.4 getArticleRatings (評価一覧取得)

```typescript
server.tool(
  "getArticleRatings",
  {
    sortBy: z.enum(['totalScore', 'createdAt', 'practicalValue', 'technicalDepth', 'understanding', 'novelty', 'importance']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    limit: z.number().int().positive().max(100).optional(),
    minScore: z.number().min(1).max(10).optional()
  },
  async ({ sortBy = 'totalScore', order = 'desc', limit = 20, minScore }) => {
    try {
      const ratings = await apiClient.getArticleRatings({
        sortBy,
        order, 
        limit,
        minScore
      });
      
      const formattedRatings = ratings.map(rating => 
        `📊 総合: ${rating.totalScore}/10 | 記事ID: ${rating.articleId}\n   実用性:${rating.practicalValue} 技術:${rating.technicalDepth} 理解:${rating.understanding} 新規:${rating.novelty} 重要:${rating.importance}`
      ).join('\n\n');
      
      return {
        content: [{
          type: "text",
          text: `記事評価一覧 (${ratings.length}件):\n\n${formattedRatings}`
        }],
        isError: false
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `評価一覧の取得に失敗しました: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);
```

## 3. APIクライアント拡張

### 3.1 新規関数追加

```typescript
// mcp/src/lib/apiClient.ts に追加

// 記事評価スキーマ
const ArticleRatingSchema = z.object({
  id: z.number(),
  articleId: z.number(),
  practicalValue: z.number(),
  technicalDepth: z.number(),
  understanding: z.number(), 
  novelty: z.number(),
  importance: z.number(),
  totalScore: z.number(),
  comment: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CreateRatingResponseSchema = z.object({
  success: z.literal(true),
  rating: ArticleRatingSchema
});

const GetRatingResponseSchema = z.object({
  success: z.literal(true),
  rating: ArticleRatingSchema
});

const GetRatingsResponseSchema = z.object({
  success: z.literal(true),
  ratings: z.array(ArticleRatingSchema),
  total: z.number()
});

// 記事評価作成
export async function createArticleRating(data: {
  articleId: number;
  practicalValue: number;
  technicalDepth: number;
  understanding: number;
  novelty: number;
  importance: number;
  comment?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/bookmarks/${data.articleId}/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create rating: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  const parsed = CreateRatingResponseSchema.safeParse(responseData);
  
  if (!parsed.success) {
    throw new Error(`Invalid API response: ${parsed.error.message}`);
  }
  
  return parsed.data.rating;
}

// 記事評価取得
export async function getArticleRating(articleId: number) {
  const response = await fetch(`${getApiBaseUrl()}/api/bookmarks/${articleId}/rating`);
  
  if (!response.ok) {
    throw new Error(`Failed to get rating: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  const parsed = GetRatingResponseSchema.safeParse(responseData);
  
  if (!parsed.success) {
    throw new Error(`Invalid API response: ${parsed.error.message}`);
  }
  
  return parsed.data.rating;
}

// 記事評価更新
export async function updateArticleRating(articleId: number, updates: {
  practicalValue?: number;
  technicalDepth?: number;
  understanding?: number;
  novelty?: number;
  importance?: number;
  comment?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/bookmarks/${articleId}/rating`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update rating: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  const parsed = CreateRatingResponseSchema.safeParse(responseData);
  
  if (!parsed.success) {
    throw new Error(`Invalid API response: ${parsed.error.message}`);
  }
  
  return parsed.data.rating;
}

// 記事評価一覧取得
export async function getArticleRatings(options: {
  sortBy?: string;
  order?: string;
  limit?: number;
  minScore?: number;
}) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  const response = await fetch(`${getApiBaseUrl()}/api/ratings?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get ratings: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  const parsed = GetRatingsResponseSchema.safeParse(responseData);
  
  if (!parsed.success) {
    throw new Error(`Invalid API response: ${parsed.error.message}`);
  }
  
  return parsed.data.ratings;
}
```

## 4. エラーハンドリング

### 4.1 想定エラーパターン

- **記事が存在しない**: 404エラーとして適切に処理
- **評価が既に存在**: 409エラーで新規作成を拒否、更新を案内
- **評価値の範囲外**: 400エラーで適切な範囲を案内
- **ネットワークエラー**: 再試行の案内

### 4.2 ユーザーフレンドリーなメッセージ

```typescript
// エラーメッセージの日本語化例
const ERROR_MESSAGES = {
  ARTICLE_NOT_FOUND: '指定された記事が見つかりません。記事IDを確認してください。',
  RATING_ALREADY_EXISTS: 'この記事には既に評価が存在します。updateArticleRating を使用して更新してください。',
  INVALID_SCORE_RANGE: '評価値は1-10の範囲で入力してください。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。しばらく時間をおいて再試行してください。'
};
```

## 5. テスト戦略

### 5.1 MCPツールテスト

```typescript
// mcp/src/test/articleRating.test.ts
describe('Article Rating MCP Tools', () => {
  test('rateArticle should create new rating', async () => {
    // 正常系テスト
  });
  
  test('rateArticle should reject invalid scores', async () => {
    // 異常系テスト: 範囲外の値
  });
  
  test('getArticleRating should return existing rating', async () => {
    // 評価取得テスト
  });
  
  test('updateArticleRating should update existing rating', async () => {
    // 更新テスト
  });
});
```

## 6. パフォーマンス考慮事項

### 6.1 レスポンス最適化

- 不要なデータの取得を避ける
- 適切なページング機能
- キャッシュ戦略の検討

### 6.2 バッチ処理

将来的な拡張として、複数記事の一括評価機能も検討可能：

```typescript
// 将来実装候補: batchRateArticles
server.tool('batchRateArticles', {
  ratings: z.array(z.object({
    articleId: z.number(),
    // ... 評価項目
  }))
}, async ({ ratings }) => {
  // 複数記事の一括評価処理
});
```