# 記事要約機能 MCP設計

## 1. 概要

MCPサーバーを利用してLLMと連携し、記事の要約を自動生成する仕組みを設計します。

## 2. アーキテクチャ

### 2.1 システム構成

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend App   │────▶│   Backend API   │────▶│   MCP Server    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Claude/LLM     │
                                                └─────────────────┘
```

### 2.2 処理フロー

1. ユーザーが記事を保存
2. Backend APIが要約生成をキューに登録
3. MCPサーバーが記事をフェッチして解析
4. LLMに要約生成を依頼
5. 生成された要約をAPIに返却
6. データベースに要約を保存

## 3. MCPツール定義

### 3.1 Tools

#### generateSummary
記事の要約を生成するツール

```typescript
{
  name: "generateSummary",
  description: "Generate a summary for an article",
  inputSchema: {
    type: "object",
    properties: {
      bookmarkId: {
        type: "number",
        description: "The ID of the bookmark to summarize"
      },
      url: {
        type: "string",
        description: "The URL of the article"
      },
      title: {
        type: "string",
        description: "The title of the article"
      },
      content: {
        type: "string",
        description: "The content of the article (if available)"
      }
    },
    required: ["bookmarkId", "url", "title"]
  }
}
```

#### batchGenerateSummaries
複数記事の要約を一括生成

```typescript
{
  name: "batchGenerateSummaries",
  description: "Generate summaries for multiple articles",
  inputSchema: {
    type: "object",
    properties: {
      bookmarks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            bookmarkId: { type: "number" },
            url: { type: "string" },
            title: { type: "string" }
          }
        },
        description: "Array of bookmarks to summarize"
      },
      limit: {
        type: "number",
        description: "Maximum number of summaries to generate",
        default: 10
      }
    },
    required: ["bookmarks"]
  }
}
```

#### updateSummary
既存の要約を更新

```typescript
{
  name: "updateSummary",
  description: "Update an existing summary",
  inputSchema: {
    type: "object",
    properties: {
      bookmarkId: {
        type: "number",
        description: "The ID of the bookmark"
      },
      summary: {
        type: "string",
        description: "The updated summary"
      }
    },
    required: ["bookmarkId", "summary"]
  }
}
```

### 3.2 Resources

#### summaryFormat
要約フォーマットの定義

```typescript
{
  uri: "summary://format",
  name: "Summary Format",
  description: "Standard format for article summaries",
  mimeType: "text/markdown"
}
```

#### summaryGuidelines
要約生成のガイドライン

```typescript
{
  uri: "summary://guidelines",
  name: "Summary Guidelines",
  description: "Guidelines for generating article summaries",
  mimeType: "text/plain"
}
```

## 4. プロンプト設計

### 4.1 要約生成プロンプト

```markdown
以下の技術記事を読んで、tl;dr形式で要約を作成してください。

要求事項：
1. 3-5個の重要なポイントを箇条書きで抽出
2. 各ポイントは1-2文で簡潔に記述
3. 技術的な要点を優先
4. 実装や応用に役立つ情報を重視
5. 記事のキーワードを3-5個抽出

記事情報：
- タイトル: {title}
- URL: {url}
- 内容: {content}

出力フォーマット：
## 要約

• ポイント1: [要約内容]
• ポイント2: [要約内容]
• ポイント3: [要約内容]

## キーワード

[キーワード1], [キーワード2], [キーワード3]
```

### 4.2 要約改善プロンプト

```markdown
既存の要約を以下の観点で改善してください：

1. より具体的な技術情報の追加
2. 実践的な応用例の明示
3. 関連技術との比較
4. 学習のポイントの明確化

既存の要約：
{existing_summary}

改善版を同じフォーマットで出力してください。
```

## 5. エラーハンドリング

### 5.1 エラーケース

1. **記事フェッチエラー**
   - URLアクセス失敗
   - コンテンツ取得タイムアウト
   - 対応：要約生成をスキップ、エラーログ記録

2. **要約生成エラー**
   - LLM応答エラー
   - フォーマット不正
   - 対応：リトライ処理、デフォルト要約の生成

3. **保存エラー**
   - データベースエラー
   - 対応：トランザクションロールバック

### 5.2 リトライ戦略

- 指数バックオフでリトライ（最大3回）
- 待機時間：1秒、2秒、4秒
- 最終的な失敗時はエラーログを記録

## 6. パフォーマンス最適化

### 6.1 バッチ処理

- 複数記事の要約を同時処理
- 並列度の制限（最大5並列）
- メモリ使用量の監視

### 6.2 キャッシング

- 記事コンテンツのキャッシュ
- 生成済み要約のキャッシュ
- TTL: 24時間

### 6.3 レート制限

- APIレート制限の遵守
- 1分あたり最大30リクエスト
- バーストトラフィックの制御

## 7. セキュリティ考慮事項

### 7.1 アクセス制御

- MCPサーバーの認証
- APIキーによる保護
- 権限の最小化

### 7.2 データ保護

- 記事コンテンツの暗号化
- センシティブ情報のフィルタリング
- ログからの個人情報除外

## 8. 実装ロードマップ

### Phase 1: 基本実装
1. MCPサーバーの基本構造
2. 要約生成ツールの実装
3. シンプルなプロンプトでのテスト

### Phase 2: 機能拡張
1. バッチ処理の実装
2. エラーハンドリングの強化
3. パフォーマンス最適化

### Phase 3: 高度な機能
1. 要約品質の向上
2. カスタマイズ可能なプロンプト
3. 分析機能の追加