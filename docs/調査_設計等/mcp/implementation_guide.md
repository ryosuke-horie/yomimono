# MCP サーバー実装ガイド

## はじめに

Model Context Protocol (MCP) は、大規模言語モデル（LLM）アプリケーションと外部データソースおよびツールの間のシームレスな統合を可能にするオープンプロトコルです。このドキュメントでは、既存の Effective Yomimono API を MCP サーバーとして拡張する方法について説明します。

## MCP の概要

### MCP とは何か

MCP（Model Context Protocol）は、LLM が外部データソースやツールにアクセスするための標準化されたプロトコルです。これにより、AI アプリケーションが安全かつ効率的に外部リソースと対話できるようになります。Anthropic によって開発され、オープンスタンダードとして公開されています。

### MCP の主要コンポーネント

1. **MCP サーバー**: 特定の機能を MCP を通じて公開する軽量プログラム
2. **MCP クライアント**: サーバーと 1:1 で接続してプロトコルを利用するクライアント
3. **リソース**: GET エンドポイントのようなもので、LLM のコンテキストに情報を読み込むために使用
4. **ツール**: POST エンドポイントのようなもので、コードを実行したり副作用を生成したりするために使用
5. **プロンプト**: LLM との対話のための再利用可能なテンプレート

## Effective Yomimono API を MCP サーバーとして実装する

### 実装アプローチ

既存の Effective Yomimono API を MCP サーバーとして拡張するには、TypeScript SDK を使用するアプローチが適しています。

### 前提条件

- Node.js v18 以上
- 既存の Effective Yomimono API へのアクセス

## TypeScript SDK を使用した実装

TypeScript SDK は、特に既存の Node.js ベースのアプリケーションに MCP を統合する場合に適しています。

### セットアップ

```bash
npm install @modelcontextprotocol/server
```

### 基本的な実装例

```typescript
import { MCPServer, ResourceClass, ToolClass } from '@modelcontextprotocol/server';
import fetch from 'node-fetch';

// 既存の API 設定
const API_BASE_URL = process.env.API_BASE_URL || "https://effective-yomimono-api.ryosuke-horie37.workers.dev";

// MCP サーバーの作成
const server = new MCPServer({
  name: "YomimonoMCPServer",
  description: "技術記事ブックマークを管理するための MCP サーバー"
});

// 未読ブックマークリソースの定義
class UnreadBookmarksResource extends ResourceClass {
  static description = "技術記事の未読ブックマーク一覧";
  
  async get() {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/unread`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error("Failed to fetch bookmarks");
    }
    
    return data.bookmarks;
  }
}

// ブックマーク追加ツールの定義
class AddBookmarkTool extends ToolClass {
  static description = "新しいブックマークを追加する";
  static parameters = {
    url: {
      type: "string",
      description: "ブックマークする URL"
    },
    title: {
      type: "string",
      description: "ブックマークのタイトル（省略可）"
    }
  };
  
  async execute({ url, title }) {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bookmarks: [{ url, title }]
      })
    });
    
    const data = await response.json();
    return { success: data.success };
  }
}

// 既読マークツールの定義
class MarkAsReadTool extends ToolClass {
  static description = "ブックマークを既読としてマークする";
  static parameters = {
    id: {
      type: "number",
      description: "既読にするブックマークの ID"
    }
  };
  
  async execute({ id }) {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    return { success: data.success };
  }
}

// リソースとツールの登録
server.addResource("unread_bookmarks", UnreadBookmarksResource);
server.addTool("add_bookmark", AddBookmarkTool);
server.addTool("mark_as_read", MarkAsReadTool);

// サーバーの起動
server.listen(3000, () => {
  console.log("MCP Server running on port 3000");
});
```

## MCP サーバーと既存の API の統合

### 統合アプローチ

既存の Effective Yomimono API と MCP サーバーを統合する方法はいくつかあります：

#### 1. プロキシとして動作

MCP サーバーは既存の API を呼び出すプロキシとして機能し、両方を独立して実行します。

**利点**:
- 既存の API を変更する必要がない
- 段階的に MCP 機能を追加できる

**欠点**:
- 二重のインフラ管理
- 同期の問題が発生する可能性がある

#### 2. 既存の API に MCP エンドポイントを追加

既存の Hono.js API に MCP エンドポイントを直接追加します。

**利点**:
- 単一のコードベースとインフラ
- 一貫性のある開発体験

**欠点**:
- 既存の API を変更する必要がある
- 複雑さが増す可能性がある

#### 3. サービスメッシュ/API ゲートウェイアプローチ

API ゲートウェイを使用して、既存の API と新しい MCP サーバーへのトラフィックをルーティングします。

**利点**:
- 既存のサービスへの影響が最小限
- スケーラビリティとルーティングの柔軟性

**欠点**:
- 追加のインフラ要素
- 設定の複雑さ

### 推奨アプローチ

現在の Effective Yomimono のアーキテクチャとスケールを考慮すると、**アプローチ 2: 既存の API に MCP エンドポイントを追加**が最も適しているかもしれません。Cloudflare Workers 上で実行されている既存の Hono.js API に、TypeScript MCP SDK を統合できます。

## セキュリティに関する考慮事項

MCP サーバーを実装する際には、以下のセキュリティ上の考慮事項に留意してください：

1. **認証と認可**: MCP サーバーへのアクセスに適切な認証メカニズムを実装
2. **レート制限**: リソースの過剰使用を防ぐためのレート制限の実装
3. **入力検証**: すべてのユーザー入力の厳密な検証
4. **スコープ制限**: 各ツールとリソースが最小特権の原則に従うようにする
5. **監査ログ**: すべてのアクセスと操作のログ記録
6. **API キー管理**: 適切な API キー管理と定期的なローテーション

## デプロイ戦略

### Cloudflare Workers での MCP サーバーのデプロイ

既存の Effective Yomimono API が Cloudflare Workers で実行されているため、同じプラットフォームに MCP サーバーをデプロイすることを検討できます。

TypeScript SDK を使用した Cloudflare Workers へのデプロイ例：

```typescript
import { MCPServer, ResourceClass, ToolClass } from '@modelcontextprotocol/server';

export default {
  async fetch(request, env, ctx) {
    // MCP サーバーの設定
    const server = new MCPServer({
      name: "YomimonoMCPServer",
      description: "技術記事ブックマークを管理するための MCP サーバー"
    });
    
    // リソースとツールの設定...
    
    // MCP リクエストのハンドリング
    if (request.url.includes('/mcp')) {
      return server.handleRequest(request);
    }
    
    // 既存の API ハンドリング（Hono.js アプリなど）
    return existingApiHandler(request, env, ctx);
  }
};
```

## テスト戦略

### MCP サーバーのテスト

1. **単体テスト**: 各ツールとリソースの機能をモックデータでテスト
2. **統合テスト**: MCP サーバー全体の動作をテスト
3. **エンドツーエンドテスト**: MCP クライアントを使用したテスト

### テスト例（Jest + TypeScript）

```typescript
import { MCPClient } from '@modelcontextprotocol/client';

describe('Yomimono MCP Server', () => {
  let client: MCPClient;

  beforeAll(async () => {
    client = new MCPClient('http://localhost:3000');
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  test('should retrieve unread bookmarks', async () => {
    const resource = await client.getResource('unread_bookmarks');
    expect(resource).toBeDefined();
    expect(Array.isArray(resource.bookmarks)).toBe(true);
  });

  test('should add a new bookmark', async () => {
    const result = await client.callTool('add_bookmark', {
      url: 'https://example.com',
      title: 'Example Bookmark'
    });
    expect(result.success).toBe(true);
  });
});
```

## クライアント連携

### Claude との連携

MCP サーバーは、Claude などの LLM と連携して、より高度な機能を提供できます。以下は Claude と連携するクライアント例です：

```typescript
import { MCPClient } from '@modelcontextprotocol/client';
import { Anthropic } from '@anthropic-ai/sdk';

// MCP クライアントの設定
const mcpClient = new MCPClient('https://your-mcp-server.com');
await mcpClient.connect();

// Claude クライアントの設定
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude と MCP の連携
async function askClaudeWithContext(question) {
  // MCP サーバーから未読ブックマーク情報を取得
  const bookmarks = await mcpClient.getResource('unread_bookmarks');
  
  // Claude に質問と未読ブックマーク情報を送信
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `以下の未読ブックマークリストを参考に、質問に答えてください: ${JSON.stringify(bookmarks)}\n\n質問: ${question}`
          }
        ]
      }
    ]
  });
  
  return response.content;
}
```

## まとめ

MCP サーバーを Effective Yomimono API に統合することで、以下のメリットが得られます：

1. **LLM との連携**: Claude などの LLM がブックマークデータにアクセスできるようになります
2. **機能の拡張**: AI を活用した記事推薦や要約などの新機能を追加できます
3. **標準化**: オープンプロトコルを使用することで、将来的な拡張性と互換性が向上します

MCP の実装を始めるための推奨ステップ：

1. TypeScript SDK のインストールと基本的な MCP エンドポイントの追加
2. 既存の API エンドポイントを MCP リソースとツールとして公開
3. 小規模なテストと段階的なデプロイ
4. LLM クライアントとの統合テスト

## 参考リソース

- [Model Context Protocol 公式ドキュメント](https://modelcontextprotocol.io/)
- [TypeScript SDK リポジトリ](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP サーバーの例](https://github.com/modelcontextprotocol/servers)
- [Anthropic の MCP 紹介記事](https://www.anthropic.com/news/model-context-protocol)
