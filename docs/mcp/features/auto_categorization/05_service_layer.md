# ブックマーク自動分類機能 - サービス層実装

## サービス層の実装

自動分類機能のビジネスロジックを担当するサービス層の実装です。サービスは、リポジトリとコンテンツ分析ロジックを利用して、ブックマークの自動分類を行います。

### インターフェースと実装クラス

```typescript
// 分類サービスのインターフェース
export interface CategorizationService {
  // ブックマークの自動分類
  categorizeBookmarks(
    bookmarkIds?: number[],
    detailLevel?: string,
    forceRecategorize?: boolean
  ): Promise<{
    categorized: number,
    categories: Record<string, string[]>
  }>;
  
  // カテゴリの手動更新
  updateBookmarkCategories(
    bookmarkIds: number[],
    category: string,
    subcategory?: string
  ): Promise<{
    updatedCount: number
  }>;
  
  // 全カテゴリの取得
  getAllCategories(): Promise<{
    id: number,
    name: string,
    parentId?: number,
    count: number
  }[]>;
}

// 実装クラス
export class AICategorizationService implements CategorizationService {
  constructor(
    private bookmarkRepository: BookmarkRepository,
    private categoryRepository: CategoryRepository,
    private contentAnalyzer: ContentAnalyzer // 記事内容の分析を行うサービス
  ) {}
  
  // 自動分類の実装
  async categorizeBookmarks(
    bookmarkIds?: number[],
    detailLevel: string = "detailed",
    forceRecategorize: boolean = false
  ): Promise<{
    categorized: number,
    categories: Record<string, string[]>
  }> {
    // 分類対象のブックマーク取得ロジック
    const bookmarks = bookmarkIds 
      ? await this.bookmarkRepository.findByIds(bookmarkIds)
      : await this.bookmarkRepository.findUncategorized();
    
    if (bookmarks.length === 0) {
      return { categorized: 0, categories: {} };
    }
    
    // 結果を格納するオブジェクト
    const categorizedResults: Record<string, string[]> = {};
    let categorizedCount = 0;
    
    // 各ブックマークの処理
    for (const bookmark of bookmarks) {
      // 既に分類済みで再分類しない場合はスキップ
      if (bookmark.category && !forceRecategorize) {
        continue;
      }
      
      // コンテンツの取得と分析
      const content = await this.contentAnalyzer.getContent(bookmark.url);
      
      if (!content) {
        continue; // コンテンツ取得失敗
      }
      
      // AIによる分類（Claude APIを使用）
      const classification = await this.analyzeWithAI(content, bookmark.title, detailLevel);
      
      if (!classification) {
        continue;
      }
      
      // 分類結果の保存
      await this.bookmarkRepository.update(bookmark.id, {
        category: classification.category,
        subcategory: classification.subcategory,
        tags: classification.tags?.join(',')
      });
      
      // 結果集計用オブジェクトの更新
      if (!categorizedResults[classification.category]) {
        categorizedResults[classification.category] = [];
      }
      
      if (classification.subcategory) {
        if (!categorizedResults[classification.category].includes(classification.subcategory)) {
          categorizedResults[classification.category].push(classification.subcategory);
        }
      }
      
      categorizedCount++;
      
      // カテゴリの保存/更新
      await this.ensureCategory(classification.category, classification.subcategory);
    }
    
    return {
      categorized: categorizedCount,
      categories: categorizedResults
    };
  }
  
  // AIを使用した分析（Claude APIの利用）
  private async analyzeWithAI(
    content: string,
    title: string,
    detailLevel: string
  ): Promise<{
    category: string,
    subcategory?: string,
    tags?: string[]
  } | null> {
    try {
      // Claudeに送るプロンプト作成
      const prompt = `
技術記事の内容を分析し、最も適切なカテゴリとサブカテゴリを決定してください。
記事のタイトル: ${title}
記事の内容:
${content.substring(0, 2000)}... // 長すぎる場合は要約

以下のJSON形式で回答してください:
{
  "category": "メインカテゴリ名",
  "subcategory": "${detailLevel === 'detailed' ? 'サブカテゴリ名' : 'null'}",
  "tags": ["関連キーワード1", "関連キーワード2", ...]
}

カテゴリ名は一般的な技術カテゴリ（フロントエンド開発、バックエンド開発、DevOps、クラウド技術など）を使用してください。
サブカテゴリは主要な技術やフレームワーク（React、Node.js、Kubernetes など）を使用してください。
      `;
      
      // Claude API呼び出し
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY as string,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
      
      const result = await response.json();
      const content = result.content[0].text;
      
      // JSONの抽出（正規表現で簡易的に）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        return {
          category: classification.category,
          subcategory: classification.subcategory !== 'null' ? classification.subcategory : undefined,
          tags: classification.tags
        };
      }
      
      return null;
    } catch (error) {
      console.error('AIによる分析中にエラーが発生しました:', error);
      return null;
    }
  }
  
  // カテゴリの更新
  async updateBookmarkCategories(
    bookmarkIds: number[],
    category: string,
    subcategory?: string
  ): Promise<{ updatedCount: number }> {
    if (!bookmarkIds || bookmarkIds.length === 0) {
      return { updatedCount: 0 };
    }
    
    // カテゴリの存在を確認／作成
    await this.ensureCategory(category, subcategory);
    
    // ブックマークの更新
    let updatedCount = 0;
    
    for (const id of bookmarkIds) {
      const result = await this.bookmarkRepository.update(id, {
        category,
        subcategory: subcategory || null
      });
      
      if (result) {
        updatedCount++;
      }
    }
    
    return { updatedCount };
  }
  
  // カテゴリの保存/更新を確認
  private async ensureCategory(
    categoryName: string,
    subcategoryName?: string
  ): Promise<void> {
    // メインカテゴリの確認/作成
    let category = await this.categoryRepository.findByName(categoryName);
    
    if (!category) {
      const categoryId = await this.categoryRepository.create({
        name: categoryName,
        description: `${categoryName}に関連する記事`,
        count: 1
      });
      
      category = { id: categoryId, name: categoryName, count: 1 };
    } else {
      // カウンターの更新
      await this.categoryRepository.incrementCount(category.id);
    }
    
    // サブカテゴリがある場合の処理
    if (subcategoryName) {
      const subcategory = await this.categoryRepository.findByName(subcategoryName);
      
      if (!subcategory) {
        await this.categoryRepository.create({
          name: subcategoryName,
          parentId: category.id,
          description: `${categoryName}/${subcategoryName}に関連する記事`,
          count: 1
        });
      } else {
        await this.categoryRepository.incrementCount(subcategory.id);
      }
    }
  }
  
  // 全カテゴリの取得
  async getAllCategories(): Promise<{
    id: number,
    name: string,
    parentId?: number,
    count: number
  }[]> {
    return this.categoryRepository.findAll();
  }
}
```

## コンテンツ分析インターフェース

ブックマークされたURLからコンテンツを取得・解析するためのインターフェースとその実装です。

```typescript
// コンテンツ分析インターフェース
interface ContentAnalyzer {
  getContent(url: string): Promise<string | null>;
}

// 実装クラス
class URLContentAnalyzer implements ContentAnalyzer {
  async getContent(url: string): Promise<string | null> {
    try {
      // Cheerioなどを使ったスクレイピング実装
      // または、外部サービス（Readability APIなど）を利用
      
      const response = await fetch(url);
      const html = await response.text();
      
      // HTMLからメインコンテンツを抽出
      const $ = cheerio.load(html);
      
      // メタデータの取得
      const title = $('title').text();
      const description = $('meta[name="description"]').attr('content') || '';
      
      // 本文の抽出（簡易的な実装）
      const articleContent = $('article').text() || $('main').text() || $('body').text();
      
      // 本文のクリーニング
      const cleanedContent = articleContent
        .replace(/\s+/g, ' ')
        .trim();
      
      return `${title}\n${description}\n\n${cleanedContent}`;
    } catch (error) {
      console.error('コンテンツ取得中にエラーが発生しました:', url, error);
      return null;
    }
  }
}
```

## 依存性注入と設定

サービス層の依存性を設定し、MCPサーバーに統合する部分の実装例です。

```typescript
// サービスの作成と依存性注入
export function createCategorizationService(
  db: DrizzleD1Database,
  apiKey: string
): CategorizationService {
  // リポジトリの作成
  const bookmarkRepository = new DrizzleBookmarkRepository(db);
  const categoryRepository = new DrizzleCategoryRepository(db);
  
  // コンテンツ分析サービスの作成
  const contentAnalyzer = new URLContentAnalyzer();
  
  // サービスの作成と返却
  return new AICategorizationService(
    bookmarkRepository,
    categoryRepository,
    contentAnalyzer
  );
}

// アプリケーション初期化時の統合例
export function initializeApp(env: Env) {
  // データベース接続
  const db = drizzle(env.DB);
  
  // サービスの作成
  const bookmarkService = new DefaultBookmarkService(new DrizzleBookmarkRepository(db));
  const categorizationService = createCategorizationService(db, env.ANTHROPIC_API_KEY);
  
  // MCPサーバーの作成
  const mcpServer = new MCPServer({
    name: "YomimonoMCPServer",
    description: "技術記事ブックマークを管理するためのMCPサーバー"
  });
  
  // 既存のリソースとツールの登録
  registerBookmarkTools(mcpServer, bookmarkService);
  
  // 分類関連のリソースとツールの登録
  registerCategorizationTools(mcpServer, categorizationService);
  
  return { mcpServer, bookmarkService, categorizationService };
}
```

## 主要なポイント

1. **サービス層の分離**
   - 分類ロジックをサービス層に分離し、MCPツールからは直接このサービスを利用
   - 依存性注入パターンにより、テスト容易性と拡張性を確保

2. **AIを活用した分類**
   - Claude APIを使用して、ブックマークされた技術記事の内容を分析し分類
   - 適切なプロンプトエンジニアリングにより、品質の高い分類結果を得る

3. **非同期処理**
   - コンテンツ取得や分析などの重い処理は非同期で実行
   - 複数のブックマークを効率的に処理

4. **エラーハンドリング**
   - コンテンツ取得失敗や分析エラーなどに対して適切なエラーハンドリング
   - 一部のブックマークの処理失敗が全体の処理を妨げないよう設計

5. **拡張性と再利用性**
   - インターフェースを使用した実装により、将来的な拡張や実装変更に対応
   - コンテンツ分析部分を分離することで、他の機能での再利用が可能
