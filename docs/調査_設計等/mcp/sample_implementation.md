# MCP サーバー実装サンプル

このドキュメントでは、Effective Yomimono API のために具体的な MCP サーバー実装サンプルを提供します。これらのサンプルコードは、実際のプロジェクトに適用する際の参考として使用できます。

## TypeScript を使用した実装（Hono.js 統合版）

このサンプルは、既存の Hono.js API に MCP エンドポイントを追加する方法を示しています。

### 1. プロジェクトの準備

まず、必要なパッケージをインストールします：

```bash
cd api
npm install @modelcontextprotocol/server
```

### 2. MCP サーバークラスの作成

`src/mcp/server.ts` ファイルを作成します：

```typescript
import { MCPServer, ResourceClass, ToolClass } from '@modelcontextprotocol/server';
import type { BookmarkService } from '../services/bookmark';

// MCPサーバークラス
export class YomimonoMCPServer {
  private server: MCPServer;
  private bookmarkService: BookmarkService;

  constructor(bookmarkService: BookmarkService) {
    this.bookmarkService = bookmarkService;
    
    // MCPサーバーの初期化
    this.server = new MCPServer({
      name: "YomimonoMCPServer",
      description: "技術記事のブックマークを管理するためのMCPサーバー"
    });
    
    // リソースとツールの登録
    this.registerResources();
    this.registerTools();
  }

  // リソースの登録
  private registerResources() {
    // 未読ブックマークリソース
    class UnreadBookmarksResource extends ResourceClass {
      static description = "未読の技術記事ブックマーク一覧";
      
      async get() {
        // BookmarkServiceを使用して未読ブックマークを取得
        const bookmarks = await this.bookmarkService.getUnreadBookmarks();
        return bookmarks;
      }
    }
    
    // ブックマークリソースのインスタンスにサービスをバインド
    UnreadBookmarksResource.prototype.bookmarkService = this.bookmarkService;
    
    // リソースをサーバーに登録
    this.server.addResource("unread_bookmarks", UnreadBookmarksResource);
  }
  
  // ツールの登録
  private registerTools() {
    // ブックマーク追加ツール
    class AddBookmarkTool extends ToolClass {
      static description = "新しいブックマークを追加する";
      static parameters = {
        url: {
          type: "string",
          description: "ブックマークするURL"
        },
        title: {
          type: "string",
          description: "ブックマークのタイトル（省略可）"
        }
      };
      
      async execute({ url, title }) {
        // BookmarkServiceを使用してブックマークを追加
        await this.bookmarkService.createBookmarksFromData([{ url, title: title || "" }]);
        return { success: true };
      }
    }
    
    // 既読マークツール
    class MarkAsReadTool extends ToolClass {
      static description = "ブックマークを既読としてマークする";
      static parameters = {
        id: {
          type: "number",
          description: "既読にするブックマークのID"
        }
      };
      
      async execute({ id }) {
        // BookmarkServiceを使用して既読にマーク
        await this.bookmarkService.markBookmarkAsRead(id);
        return { success: true };
      }
    }
    
    // ツールのインスタンスにサービスをバインド
    AddBookmarkTool.prototype.bookmarkService = this.bookmarkService;
    MarkAsReadTool.prototype.bookmarkService = this.bookmarkService;
    
    // ツールをサーバーに登録
    this.server.addTool("add_bookmark", AddBookmarkTool);
    this.server.addTool("mark_as_read", MarkAsReadTool);
  }
  
  // リクエストハンドラ
  async handleRequest(request: Request): Promise<Response> {
    return await this.server.handleRequest(request);
  }
}
```

### 3. Hono.js との統合

`src/index.ts` ファイルを修正して MCP サーバーを統合します：

```typescript
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { createBookmarksRouter } from "./routes/bookmarks";
import { DefaultBookmarkService } from "./services/bookmark";
import { YomimonoMCPServer } from "./mcp/server";

export interface Env {
  DB: D1Database;
}

// アプリケーションファクトリ関数
export const createApp = (env: Env) => {
  const app = new Hono<{ Bindings: Env }>();

  // CORSの設定
  app.use("*", cors());

  // データベース、リポジトリ、サービスの初期化
  const db = drizzle(env.DB);
  const repository = new DrizzleBookmarkRepository(db);
  const service = new DefaultBookmarkService(repository);

  // ルーターのマウント
  const bookmarksRouter = createBookmarksRouter(service);
  app.route("/api/bookmarks", bookmarksRouter);

  // MCPサーバーの初期化と統合
  const mcpServer = new YomimonoMCPServer(service);
  
  // MCP専用エンドポイントの追加
  app.all("/api/mcp/*", async (c) => {
    // パスを正規化してMCPサーバーに渡す
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace("/api/mcp", "");
    
    const mcpRequest = new Request(url.toString(), c.req.raw);
    return await mcpServer.handleRequest(mcpRequest);
  });

  return app;
};

// デフォルトのエクスポート
export default {
  fetch: (request: Request, env: Env) => {
    const app = createApp(env);
    return app.fetch(request, env);
  },
};
```

### 4. 検出エンドポイントの追加

MCP のディスカバリーをサポートするために、ルート URL に情報を追加します：

```typescript
// src/index.ts の createApp 関数内に追加

// ルートエンドポイントにMCPサーバー情報を追加
app.get("/", (c) => {
  return c.json({
    name: "Effective Yomimono API",
    version: "1.0.0",
    description: "効率的な読書管理のためのブックマーク収集・管理APIです。",
    mcp_endpoint: "/api/mcp"
  });
});
```

## Claude デスクトップアプリと連携する例

Claude デスクトップアプリケーションと MCP サーバーを連携させる方法の例を示します。以下は、HTML ファイルを使用して Claude に MCP サーバーの存在を通知する方法です。

### HTML ファイルの作成

`claude-mcp-connector.html` ファイルを作成します：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Effective Yomimono MCP Connection</title>
  <meta name="mcp-server" content="http://localhost:3001">
</head>
<body>
  <h1>Effective Yomimono MCP コネクター</h1>
  <p>このページを Claude デスクトップアプリケーションで開くと、MCP サーバーと連携できます。</p>
  
  <div>
    <h2>利用可能なリソース</h2>
    <ul>
      <li><strong>unread_bookmarks</strong> - 未読の技術記事ブックマーク一覧</li>
    </ul>
    
    <h2>利用可能なツール</h2>
    <ul>
      <li><strong>add_bookmark</strong> - 新しいブックマークを追加する</li>
      <li><strong>mark_as_read</strong> - ブックマークを既読としてマークする</li>
    </ul>
  </div>
  
  <div>
    <h2>使用例</h2>
    <pre>
      // 未読ブックマークを取得
      const bookmarks = await getResource("unread_bookmarks");
      
      // 新しいブックマークを追加
      await callTool("add_bookmark", { 
        url: "https://example.com", 
        title: "サンプル記事" 
      });
      
      // ブックマークを既読にマーク
      await callTool("mark_as_read", { id: 123 });
    </pre>
  </div>
</body>
</html>
```

### 使用方法

1. MCP サーバーを起動します
2. 上記の HTML ファイルをブラウザまたは Claude デスクトップアプリで開きます
3. Claude デスクトップアプリは自動的に MCP サーバーを検出し、接続します
4. Claude に対して、ブックマークの取得や追加などの操作を依頼できます

## MCP サーバーのテスト

### 単体テストの例（TypeScript）

`src/mcp/server.test.ts` ファイルを作成します：

```typescript
import { YomimonoMCPServer } from './server';
import { BookmarkService } from '../services/bookmark';

// モックBookmarkService
const mockBookmarkService: BookmarkService = {
  getUnreadBookmarks: jest.fn().mockResolvedValue([
    { id: 1, url: 'https://example.com', title: 'Example', isRead: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ]),
  createBookmarksFromData: jest.fn().mockResolvedValue(undefined),
  markBookmarkAsRead: jest.fn().mockResolvedValue(undefined)
};

describe('YomimonoMCPServer', () => {
  let mcpServer: YomimonoMCPServer;
  
  beforeEach(() => {
    mcpServer = new YomimonoMCPServer(mockBookmarkService);
    jest.clearAllMocks();
  });
  
  describe('handleRequest', () => {
    it('should handle resource requests', async () => {
      // リソースリクエストを作成
      const request = new Request('https://example.com/resources/unread_bookmarks', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const response = await mcpServer.handleRequest(request);
      expect(response.status).toBe(200);
      expect(mockBookmarkService.getUnreadBookmarks).toHaveBeenCalled();
      
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0].url).toBe('https://example.com');
    });
    
    it('should handle tool requests', async () => {
      // ツールリクエストを作成
      const request = new Request('https://example.com/tools/add_bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            url: 'https://example.com',
            title: 'Test Title'
          }
        })
      });
      
      const response = await mcpServer.handleRequest(request);
      expect(response.status).toBe(200);
      expect(mockBookmarkService.createBookmarksFromData).toHaveBeenCalledWith([
        { url: 'https://example.com', title: 'Test Title' }
      ]);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
```

## デプロイ設定

### Cloudflare Workers へのデプロイ

既存の `wrangler.toml` ファイルに MCP サーバーの設定を追加します：

```toml
# wrangler.toml の既存設定に追加

# MCP サーバーの設定
[vars]
MCP_SERVER_NAME = "YomimonoMCPServer"
MCP_SERVER_DESCRIPTION = "効率的な読書管理のためのブックマーク収集・管理 MCP サーバー"
```

## Claude エージェント用のプロンプト例

以下は、Claude エージェントが MCP サーバーを使用するためのプロンプト例です：

```
あなたは Effective Yomimono の AI アシスタントです。以下の MCP サーバーを使用して、ユーザーの技術記事ブックマークを管理してください：

リソース:
- unread_bookmarks: 未読の技術記事ブックマーク一覧を取得します

ツール:
- add_bookmark: 新しいブックマークを追加します（パラメータ: url, title）
- mark_as_read: ブックマークを既読としてマークします（パラメータ: id）

以下の機能をサポートしてください:
1. 未読ブックマークの一覧表示
2. 新しいブックマークの追加
3. ブックマークを既読としてマーク
4. ブックマークの要約や内容に基づく推薦

ユーザーの質問に対して、必要に応じて MCP リソースとツールを使用して回答してください。
```

## まとめ

この実装サンプルにより、Effective Yomimono API を MCP サーバーとして拡張する方法が分かります。主なアプローチとして、Hono.js と統合した TypeScript MCP サーバーを紹介しました。このアプローチの利点は以下の通りです：

- 既存の API コードベースに直接統合
- 同じサービスとデータアクセス層を再利用
- Cloudflare Workers 上での実行に最適化

このアプローチを採用することで、プロジェクトの要件と既存のインフラストラクチャに基づいた効率的な実装が可能になります。
