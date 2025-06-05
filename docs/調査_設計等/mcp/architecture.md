# MCPディレクトリアーキテクチャ仕様書

## 概要

effective-yomimonoプロジェクトのMCP（Model Context Protocol）ディレクトリの詳細なアーキテクチャと実装内容について記述する。

## ディレクトリ構成

```
mcp/
├── README.md                # プロジェクト概要とセットアップガイド
├── package.json            # 依存関係とスクリプト定義
├── tsconfig.json           # TypeScript設定
├── vitest.config.ts        # テスト設定
├── biome.json             # リント・フォーマット設定
├── index.ts               # ルートエントリーポイント
├── build/                 # ビルド出力（TypeScriptコンパイル後）
├── coverage/              # テストカバレッジレポート
├── node_modules/          # 依存関係
└── src/                   # ソースコード
    ├── index.ts           # MCPサーバーメインファイル
    ├── lib/               # 共通ライブラリ
    │   ├── apiClient.ts   # API通信クライアント
    │   └── articleContentFetcher.ts  # 記事コンテンツ取得機能
    └── test/              # テストファイル群
        ├── apiClient.comprehensive.test.ts
        ├── articleContentFetcher.*.test.ts
        ├── getUnreadArticlesByLabel.test.ts
        ├── index.main.test.ts
        ├── integration-mcp-api.test.ts
        ├── mcpServer.test.ts
        ├── ratingApiClient.test.ts
        ├── ratingMcpTools.test.ts
        └── readStatus.test.ts
```

## 依存関係とライブラリ

### 主要依存関係

#### プロダクション依存関係
- **@modelcontextprotocol/sdk** (^1.12.1): MCPプロトコル実装のコアSDK
- **zod** (^3.25.50): スキーマ検証とTypeScript型安全性

#### 開発依存関係
- **@biomejs/biome** (^1.9.4): 高速なリント・フォーマットツール
- **@types/node** (^22.15.29): Node.js型定義
- **@vitest/coverage-v8** (^3.2.1): テストカバレッジ計測
- **dotenv** (^16.5.0): 環境変数管理
- **playwright** (^1.52.0): 高度な記事内容取得用ブラウザ自動化
- **vitest** (^3.1.4): 高速テストランナー
- **typescript** (^5.8.3): TypeScriptコンパイラ（peerDependency）

### スクリプト定義

```json
{
  "build": "tsc",                    // TypeScriptコンパイル
  "lint": "biome check --write .",   // リント実行
  "format": "biome format --write .", // フォーマット実行
  "typecheck": "tsc --noEmit",       // 型チェックのみ
  "test": "vitest run",              // テスト実行
  "test:watch": "vitest",            // テスト監視モード
  "test:coverage": "vitest run --coverage" // カバレッジ付きテスト
}
```

## アーキテクチャ詳細

### 1. MCPサーバーコア (`src/index.ts`)

#### 基本構成
- **サーバー名**: "EffectiveYomimonoLabeler"
- **バージョン**: "0.6.0" (Phase 2: 高度なMCP評価ツール)
- **通信方式**: Stdio transport (標準入出力)
- **プロトコル**: Model Context Protocol v1.12.1

#### 提供ツール群

##### ラベル管理ツール（8種類）
1. **getUnlabeledArticles**: ラベルなし記事取得
2. **getLabels**: 既存ラベル一覧取得
3. **assignLabel**: 記事へのラベル割り当て
4. **createLabel**: 新ラベル作成
5. **getLabelById**: 特定ラベル取得
6. **deleteLabel**: ラベル削除
7. **updateLabelDescription**: ラベル説明更新
8. **assignLabelsToMultipleArticles**: 一括ラベル付与

##### 記事管理ツール（5種類）
9. **getBookmarkById**: ブックマーク詳細取得
10. **getUnreadArticlesByLabel**: ラベル別未読記事取得
11. **getUnreadBookmarks**: 未読ブックマーク一覧
12. **getReadBookmarks**: 既読ブックマーク一覧
13. **markBookmarkAsRead**: 既読マーク

##### 記事評価ツール（6種類）
14. **rateArticleWithContent**: 記事内容付き評価準備
15. **createArticleRating**: 記事評価作成
16. **getArticleRating**: 記事評価取得
17. **updateArticleRating**: 記事評価更新
18. **getArticleRatings**: 評価一覧（フィルター・ソート対応）
19. **getRatingStats**: 評価統計情報取得

##### 高度なMCP機能ツール（2種類）
20. **getTopRatedArticles**: 高評価記事Top取得
21. **bulkRateArticles**: 一括評価（最大10件）

### 2. API通信クライアント (`src/lib/apiClient.ts`)

#### 設計思想
- **型安全性**: Zodスキーマによる厳密な入出力検証
- **エラーハンドリング**: 詳細なエラーメッセージとコンテキスト
- **環境設定**: API_BASE_URL環境変数による柔軟な接続先設定

#### 主要機能
```typescript
// ラベル管理
export async function getUnlabeledArticles()
export async function getLabels()
export async function assignLabelToArticle()
export async function createLabel()
export async function getLabelById()
export async function deleteLabel()
export async function updateLabelDescription()
export async function assignLabelsToMultipleArticles()

// ブックマーク管理
export async function getBookmarkById()
export async function getUnreadArticlesByLabel()
export async function getUnreadBookmarks()
export async function getReadBookmarks()
export async function markBookmarkAsRead()

// 評価機能
export async function createArticleRating()
export async function getArticleRating()
export async function updateArticleRating()
export async function deleteArticleRating()
export async function getArticleRatings()
export async function getRatingStats()
```

#### スキーマ検証
各API応答に対する厳密な型定義：
```typescript
const ArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
});

const ArticleRatingSchema = z.object({
  id: z.number(),
  articleId: z.number(),
  practicalValue: z.number(),
  technicalDepth: z.number(),
  understanding: z.number(),
  novelty: z.number(),
  importance: z.number(),
  totalScore: z.number(),
  comment: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### 3. 記事内容取得機能 (`src/lib/articleContentFetcher.ts`)

#### 高度な記事抽出システム

##### アーキテクチャ設計
- **多段階抽出戦略**: 品質順に複数の抽出方法を試行
- **サイト別最適化**: 主要サイト（Zenn、Qiita、note、Medium）向け専用セレクター
- **品質評価**: 抽出内容の品質スコア算出（0.0-1.0）
- **Playwright連携**: 高度なブラウザ自動化による確実な内容取得

##### 抽出戦略（優先順）
1. **構造化データ抽出** (品質閾値: 0.8)
   - JSON-LD形式の構造化データ
   - Open Graph / Twitter Card メタデータ
   
2. **セマンティック要素抽出** (品質閾値: 0.6)
   - article, main等のセマンティックHTML要素
   
3. **サイト固有戦略** (品質閾値: 0.7)
   - 各サイト専用セレクター使用
   
4. **汎用セレクター抽出** (品質閾値: 0.4)
   - フォールバック用汎用的セレクター

##### サイト別最適化設定
```typescript
const SITE_STRATEGIES: Record<string, SiteStrategy> = {
  "zenn.dev": {
    selectors: [".znc", ".zenn-content"],
    metadata: {
      author: [".ArticleHeader_author a"],
      publishedDate: ["[datetime]"],
      tags: [".ArticleHeader_tag"],
    }
  },
  "qiita.com": {
    selectors: [".it-MdContent"],
    metadata: {
      author: [".p-items_authorName"],
      publishedDate: [".p-items_createdAt"],
    }
  }
  // ... 他サイト設定
}
```

##### 高度な評価プロンプト生成
記事評価用の詳細なプロンプトテンプレート：
- **5軸評価**: 実用性、技術深度、理解度、新規性、重要度
- **評価基準明示**: 各軸1-10点の詳細な評価基準
- **JSON出力形式**: 構造化された評価結果フォーマット

#### フォールバック機能
Playwrightが利用できない場合の軽量HTML取得：
```typescript
async function fallbackFetchContent(url: string): Promise<ArticleContent> {
  const response = await fetch(url);
  const html = await response.text();
  return extractContentFromHTML(html);
}
```

## テスト戦略

### テストカバレッジ
- **総テストファイル数**: 15ファイル
- **テスト観点**: 単体テスト、統合テスト、包括テスト
- **モック戦略**: fetch API、Playwright Browser/Page の完全モック

### 主要テストカテゴリ
1. **API通信テスト**: 各API関数の正常系・異常系
2. **記事抽出テスト**: 各抽出戦略の動作検証
3. **MCPツールテスト**: MCPサーバーツールの統合テスト
4. **評価機能テスト**: 評価関連APIの完全テスト

## 開発・運用環境

### ローカル開発
```bash
cd mcp
npm run build     # TypeScriptコンパイル
npm run test      # テスト実行
npm run lint      # リント実行
```

### Claude Desktop連携
```json
// claude_desktop_config.json
"effective-yomimono-mcp": {
  "command": "node",
  "args": ["/path/to/effective-yomimono/mcp/build/index.js"],
  "env": {
    "API_BASE_URL": "https://effective-yomimono-api.ryosuke-horie37.workers.dev"
  }
}
```

### 環境変数
- **API_BASE_URL**: バックエンドAPIのベースURL
  - 開発: ローカルAPI URL
  - 本番: https://effective-yomimono-api.ryosuke-horie37.workers.dev

## 設計原則・特徴

### 1. 型安全性の徹底
- 全API通信でZodスキーマ検証
- TypeScript strict mode完全対応
- 実行時型チェックによる堅牢性

### 2. 段階的フォールバック
- Playwright → フォールバックfetch
- 構造化データ → セマンティック → サイト固有 → 汎用
- 高品質データ優先の多段階取得

### 3. 拡張性設計
- プラグイン形式のサイト戦略追加
- MCPツールの段階的機能拡張
- Phase 2対応の高度な評価・統計機能

### 4. 品質重視
- テストカバレッジ重視の開発
- 詳細なエラーハンドリングとログ
- 抽出品質の定量的評価

## 今後の拡張予定

1. **サイト対応拡張**: より多くの技術ブログ・サイトへの対応
2. **評価機能拡充**: ML/AIを活用した自動評価機能
3. **パフォーマンス最適化**: 大量記事処理の高速化
4. **リアルタイム連携**: WebSocket等によるリアルタイム更新

## まとめ

MCPディレクトリは、effective-yomimonoプロジェクトにおけるClaude Desktop連携の核となる高度なMCPサーバー実装である。型安全性、拡張性、品質を重視した設計により、記事管理・評価業務の大幅な効率化を実現している。