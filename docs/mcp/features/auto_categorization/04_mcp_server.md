# ブックマーク自動分類機能 - MCP サーバー拡張

## MCP サーバー拡張

Model Context Protocol (MCP) サーバーを拡張して、AI を活用した自動分類機能を提供します。以下のリソースとツールを実装します。

```typescript
// カテゴリ関連リソース
class CategoriesResource extends ResourceClass {
  static description = "ブックマークカテゴリの一覧";
  
  async get() {
    // カテゴリ情報の取得
    const categories = await this.categoryService.getAllCategories();
    return { categories };
  }
}

// 自動分類ツール
class AutoCategorizeToolResource extends ToolClass {
  static description = "ブックマークの自動分類を実行";
  static parameters = {
    bookmarkIds: {
      type: "array",
      items: { type: "number" },
      description: "分類するブックマークのID一覧（指定しない場合は未分類の全ブックマーク）"
    },
    options: {
      type: "object",
      properties: {
        detailLevel: {
          type: "string",
          enum: ["simple", "detailed"],
          description: "分類の詳細レベル（simple=主要カテゴリのみ、detailed=サブカテゴリまで）"
        },
        forceRecategorize: {
          type: "boolean",
          description: "既に分類されているブックマークも再分類するか"
        }
      }
    }
  };
  
  async execute({ bookmarkIds, options = {} }) {
    // オプションのデフォルト値設定
    const detailLevel = options.detailLevel || "detailed";
    const forceRecategorize = options.forceRecategorize || false;
    
    // 自動分類の実行
    const result = await this.categorizationService.categorizeBookmarks(
      bookmarkIds,
      detailLevel,
      forceRecategorize
    );
    
    return {
      success: true,
      categorized: result.categorized,
      categories: result.categories
    };
  }
}

// カテゴリ更新ツール
class UpdateCategoryTool extends ToolClass {
  static description = "ブックマークのカテゴリを更新";
  static parameters = {
    bookmarkIds: {
      type: "array",
      items: { type: "number" },
      description: "更新するブックマークのID一覧"
    },
    category: {
      type: "string",
      description: "設定するカテゴリ名"
    },
    subcategory: {
      type: "string",
      description: "設定するサブカテゴリ名（省略可）"
    }
  };
  
  async execute({ bookmarkIds, category, subcategory }) {
    // カテゴリの更新
    const result = await this.categorizationService.updateBookmarkCategories(
      bookmarkIds,
      category,
      subcategory
    );
    
    return {
      success: true,
      updated: result.updatedCount
    };
  }
}
```

## リソースとツールの説明

### リソース

1. **CategoriesResource**
   - **説明**: ブックマークカテゴリの一覧を取得するリソース
   - **メソッド**: `get` - 全カテゴリとそのメタデータ（サブカテゴリ、ブックマーク数など）を取得
   - **用途**: カテゴリフィルターUI、分類統計の表示などに使用

### ツール

1. **AutoCategorizeToolResource**
   - **説明**: ブックマークの自動分類を実行するツール
   - **パラメータ**:
     - `bookmarkIds` (オプション): 分類する特定のブックマークID一覧（未指定時は全未分類ブックマーク）
     - `options`: 
       - `detailLevel`: 分類の詳細レベル（`simple` または `detailed`）
       - `forceRecategorize`: 既に分類されている項目も再分類するかどうか
   - **動作**: 指定されたブックマークの内容を分析し、適切なカテゴリとサブカテゴリに自動分類
   - **戻り値**: 分類結果のサマリー（分類されたブックマーク数、カテゴリごとの内訳）

2. **UpdateCategoryTool**
   - **説明**: ブックマークのカテゴリを手動で更新するツール
   - **パラメータ**:
     - `bookmarkIds`: 更新するブックマークID一覧
     - `category`: 新しいカテゴリ名
     - `subcategory` (オプション): 新しいサブカテゴリ名
   - **動作**: 指定されたブックマークのカテゴリ情報を更新
   - **戻り値**: 更新されたブックマーク数

## MCP サーバーへの統合

これらのリソースとツールを MCP サーバーに登録する方法:

```typescript
// MCP サーバーに登録
export function registerCategorizationTools(server: MCPServer, categorizationService: CategorizationService) {
  // カテゴリリソースの登録
  class BoundCategoriesResource extends CategoriesResource {
    categoryService = categorizationService;
  }
  server.addResource("categories", BoundCategoriesResource);
  
  // 自動分類ツールの登録
  class BoundAutoCategorizeToolResource extends AutoCategorizeToolResource {
    categorizationService = categorizationService;
  }
  server.addTool("auto_categorize", BoundAutoCategorizeToolResource);
  
  // カテゴリ更新ツールの登録
  class BoundUpdateCategoryTool extends UpdateCategoryTool {
    categorizationService = categorizationService;
  }
  server.addTool("update_category", BoundUpdateCategoryTool);
}
```

## AI アシスタントとの対話例

MCP を通じた AI アシスタントとの対話例:

```
ユーザー: 先週保存したブックマークを分類してほしい

AI: [gets unread_bookmarks resource]
   過去1週間に保存された未分類のブックマークが10件あります。自動分類を実行しますか？

ユーザー: はい、お願いします

AI: [calls auto_categorize tool]
   分類が完了しました。以下のカテゴリに分類されました：
   - フロントエンド開発: 4件 (React: 2件, CSS: 2件)
   - バックエンド開発: 3件 (Node.js: 1件, データベース: 2件)
   - クラウド技術: 3件 (Cloudflare: 2件, AWS: 1件)
   
   これらの分類を適用しますか？必要に応じて調整も可能です。

ユーザー: Cloudflareの2つは「サーバーレス」というカテゴリにしてほしい

AI: [calls update_category tool]
   了解しました。Cloudflareに関連する2つの記事を「サーバーレス」カテゴリに変更しました。
   他に調整が必要な点はありますか？

ユーザー: それで大丈夫です、ありがとう

AI: カテゴリ分類が完了しました。ブックマークリストにて確認できます。
```
