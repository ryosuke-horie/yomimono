# 記事要約機能 MCP設計

> **注意 (2025-10-18 更新)**: `getBookmarksWithoutSummary`、`saveSummary`、`updateSummary`、`getBookmarkById` など要約関連のMCPツールは廃止済みです。本ドキュメントはアーカイブ目的で残しており、実装は現在存在しません。

## 1. 概要

Claude Desktop上でMCPサーバーを利用して、記事の要約を作成・更新する仕組みを設計します。ユーザーがClaude Desktopを通じて記事のURLを読み込ませ、生成した要約をAPIに保存します。

## 2. アーキテクチャ

### 2.1 システム構成

```
┌───────────────────┐     ┌─────────────────┐
│  Claude Desktop   │────▶│   MCP Server    │
└───────────────────┘     └─────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         │                │  Backend API    │
         │                └─────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         └───────────────▶│   Database      │
                          └─────────────────┘
```

### 2.2 処理フロー

1. ユーザーがClaude Desktopで要約を作成したい記事を選択
2. MCPツールで未要約記事を取得
3. ユーザーが記事のURLをClaude Desktopで読み込み
4. Claude Desktopが要約を生成
5. MCPツールで要約をAPIに保存
6. データベースに要約を永続化

## 3. MCPツール定義（アーカイブ）

### 3.1 Tools

#### getBookmarksWithoutSummary
要約が未作成の記事を取得するツール

```typescript
{
  name: "getBookmarksWithoutSummary",
  description: "Get bookmarks that don't have summaries yet",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of bookmarks to return",
        default: 5
      },
      orderBy: {
        type: "string",
        description: "Order by field (createdAt or readAt)",
        default: "createdAt",
        enum: ["createdAt", "readAt"]
      }
    }
  }
}
```

#### saveSummary
生成した要約を保存するツール

```typescript
{
  name: "saveSummary",
  description: "Save a generated summary for a bookmark",
  inputSchema: {
    type: "object",
    properties: {
      bookmarkId: {
        type: "number",
        description: "The ID of the bookmark"
      },
      summary: {
        type: "string",
        description: "The generated summary in markdown format"
      }
    },
    required: ["bookmarkId", "summary"]
  }
}
```

#### updateSummary
既存の要約を更新するツール

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
        description: "The updated summary in markdown format"
      }
    },
    required: ["bookmarkId", "summary"]
  }
}
```

#### getBookmarkById
特定のブックマークを取得するツール

```typescript
{
  name: "getBookmarkById",
  description: "Get a specific bookmark by ID",
  inputSchema: {
    type: "object",
    properties: {
      bookmarkId: {
        type: "number",
        description: "The ID of the bookmark"
      }
    },
    required: ["bookmarkId"]
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

## 4. MCPツールの使用フロー

### 4.1 要約作成フロー

1. **未要約記事の取得**
   ```javascript
   // ユーザーがMCPツールを実行
   const bookmarks = await getBookmarksWithoutSummary({ limit: 5 });
   ```

2. **記事の読み込み**
   - ユーザーが記事のURLをClaude Desktopに提供
   - Claude Desktopが記事の内容を分析

3. **要約の生成**
   - Claude Desktopが記事から要約を生成
   - tl;dr形式で重要ポイントを抽出

4. **要約の保存**
   ```javascript
   // ユーザーがMCPツールで要約を保存
   await saveSummary({
     bookmarkId: 123,
     summary: "生成された要約テキスト"
   });
   ```

### 4.2 要約形式ガイドライン

```markdown
## 要約

• ポイント1: [記事の核心的な内容]
• ポイント2: [技術的な重要事項]
• ポイント3: [実装や応用に関する情報]
• ポイント4: [補足的な重要情報]（オプション）
• ポイント5: [関連技術や展望]（オプション）

## キーワード

[技術キーワード1], [技術キーワード2], [技術キーワード3]
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
