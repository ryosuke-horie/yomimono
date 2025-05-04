# Cloudflare Workers間の通信と認証

## 概要

この文書では、Effective Yomimonoプロジェクトにおける複数のCloudflare Workers間の通信方法と、Cloudflare Accessで保護されたWorkersへのアクセス方法について詳述します。フロントエンドWorker（Next.js）からバックエンドWorker（API）への安全な通信実装に焦点を当てています。

## Workers間通信の基本

Cloudflare Workers間で通信を行う主な方法は以下の通りです：

1. **直接HTTP(S)リクエスト**
   - 標準の`fetch` APIを使用して別のWorkerエンドポイントにリクエスト
   - ヘッダーに認証情報を含めて送信

2. **サービスバインディング**
   - Workers間の直接接続を提供する機能
   - ワーカー設定ファイル（wrangler.toml）で定義

3. **Cloudflare Access Service Token**
   - Cloudflare Accessで保護されたリソースへのアクセスに使用
   - 専用の認証ヘッダーを付与して通信

## 直接HTTP(S)リクエストの実装

### 基本的なHTTP(S)リクエスト

```typescript
// Worker A（フロントエンド）からWorker B（API）へのリクエスト例
async function callApiWorker(path: string, options: RequestInit = {}) {
  const apiUrl = 'https://api.your-domain.workers.dev';
  
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Worker間通信エラー:', error);
    throw error;
  }
}
```

### Cloudflare Accessサービストークンを使用したリクエスト

Cloudflare Accessで保護されたWorkerへのリクエスト例：

```typescript
// Cloudflare Accessサービストークンを使用したリクエスト
async function callProtectedApiWorker(path: string, options: RequestInit = {}) {
  const apiUrl = 'https://api.your-domain.workers.dev';
  const cfAccessClientId = '環境変数から取得したClient ID';
  const cfAccessClientSecret = '環境変数から取得したClient Secret';
  
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Cloudflare Access認証ヘッダー
        'CF-Access-Client-Id': cfAccessClientId,
        'CF-Access-Client-Secret': cfAccessClientSecret,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Protected API request failed: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Protected Worker間通信エラー:', error);
    throw error;
  }
}
```

実際の実装では、以下のようにこれらの認証情報を環境変数として設定します：

```toml
# wrangler.toml (フロントエンドWorker)
[vars]
CF_ACCESS_CLIENT_ID = "your-client-id"
CF_ACCESS_CLIENT_SECRET = "your-client-secret"
```

そして、環境変数からアクセスします：

```typescript
// 環境変数からサービストークン情報を取得
async function callProtectedApiWorker(path: string, options: RequestInit = {}) {
  const apiUrl = 'https://api.your-domain.workers.dev';
  
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // 環境変数から認証情報を取得
        'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
        ...options.headers,
      },
    });
    
    // 応答処理...
  } catch (error) {
    // エラー処理...
  }
}
```

## サービスバインディングの実装

サービスバインディングは、Workers間の直接通信を可能にする機能です。次の手順で設定します：

### 1. サービスバインディングの定義

```toml
# wrangler.toml（フロントエンドWorker）
[[services]]
binding = "API" # コード内で使用する変数名
service = "api-worker" # 対象となるWorkerの名前
environment = "production" # 環境（optionalだが、推奨）
```

### 2. バインディングの使用

```typescript
// フロントエンドWorkerからAPIバインディングを使用
export interface Env {
  API: Fetcher; // サービスバインディング型
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // サービスバインディングを使用したAPI呼び出し
    // このAPI呼び出しはCloudflare内部で行われるが、
    // Cloudflare Accessで保護されている場合は認証ヘッダーが必要
    const apiResponse = await env.API.fetch(new Request('https://api.internal/data', {
      headers: {
        'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
      }
    }));
    
    const data = await apiResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## 保護されたAPIとの通信設計

### 1. 認証フローの概要

フロントエンドWorkerがCloudflare Accessで保護されたバックエンドAPIにアクセスする際の認証フロー：

1. ユーザーがフロントエンドにアクセス（Cloudflare Accessによる認証を経由）
2. フロントエンドワーカーがバックエンドAPIにリクエスト送信（サービストークン認証）
3. バックエンドAPIがサービストークンを検証
4. リクエスト処理と応答の返送

### 2. Next.jsフロントエンドWorkerの設定

```typescript
// src/lib/api/config.ts (Next.js App Router)
import { cookies } from 'next/headers';

// APIクライアント関数
export async function fetchFromApi(
  path: string, 
  options: RequestInit = {}
) {
  const apiUrl = process.env.API_URL || 'https://api.your-domain.workers.dev';
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  // Cloudflare Access認証ヘッダー追加
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    headers.set('CF-Access-Client-Id', process.env.CF_ACCESS_CLIENT_ID);
    headers.set('CF-Access-Client-Secret', process.env.CF_ACCESS_CLIENT_SECRET);
  }
  
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
      // キャッシュ制御（必要に応じて）
      cache: 'no-store', // APIリクエストをキャッシュしない
    });
    
    if (!response.ok) {
      // エラーレスポンスの処理
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}
```

### 3. API Workerでの認証検証

```typescript
// src/middleware/auth.ts (API Worker)
import { Context, Next } from 'hono';

// Cloudflare Accessサービストークン検証ミドルウェア
export async function validateAccessToken(c: Context, next: Next) {
  const clientId = c.req.header('CF-Access-Client-Id');
  const clientSecret = c.req.header('CF-Access-Client-Secret');
  
  // 環境変数の認証情報と比較
  const validClientId = c.env.CF_ACCESS_CLIENT_ID;
  const validClientSecret = c.env.CF_ACCESS_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || 
      clientId !== validClientId || 
      clientSecret !== validClientSecret) {
    return c.json({
      success: false,
      error: 'Invalid or missing authentication credentials'
    }, 403);
  }
  
  // 認証成功
  await next();
}
```

### 4. Honoルーターへの適用

```typescript
// src/index.ts (API Worker)
import { Hono } from 'hono';
import { validateAccessToken } from './middleware/auth';
import bookmarksRoutes from './routes/bookmarks';
import labelsRoutes from './routes/labels';

const app = new Hono();

// CORSミドルウェア設定
app.use('/*', cors({
  origin: ['https://frontend.your-domain.workers.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'CF-Access-Client-Id', 'CF-Access-Client-Secret'],
  maxAge: 86400,
}));

// 認証ミドルウェアを全ルートに適用
app.use('/*', validateAccessToken);

// ルート定義
app.route('/bookmarks', bookmarksRoutes);
app.route('/labels', labelsRoutes);

export default app;
```

## 環境変数の設定と管理

### 1. フロントエンドWorkerの環境変数

Next.jsプロジェクトの環境変数（`.env.local` または Cloudflare環境変数）：

```dotenv
# API接続設定
API_URL=https://api.your-domain.workers.dev

# Cloudflare Access認証
CF_ACCESS_CLIENT_ID=your-client-id-value
CF_ACCESS_CLIENT_SECRET=your-client-secret-value
```

### 2. APIバックエンドWorkerの環境変数

APIバックエンドの環境変数（Wrangler設定またはCloudflareダッシュボード）：

```toml
# wrangler.toml
[vars]
CF_ACCESS_CLIENT_ID = "your-client-id-value"
CF_ACCESS_CLIENT_SECRET = "your-client-secret-value"
```

## エラー処理とリトライ戦略

Worker間通信では、適切なエラー処理とリトライ戦略が重要です：

```typescript
// リトライ機能付きAPIリクエスト
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3
) {
  let attempts = 0;
  let lastError;
  
  while (attempts < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // 特定のエラーコードでリトライするかどうかを判断
      if (response.status >= 500) {
        // サーバーエラーの場合はリトライ
        lastError = new Error(`Server error: ${response.status}`);
      } else if (response.status === 429) {
        // レート制限の場合は少し長めに待機してリトライ
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
        lastError = new Error('Rate limited');
      } else {
        // その他のエラーはリトライしない
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }
    
    // 次のリトライまで待機（指数バックオフ）
    const waitTime = Math.min(1000 * Math.pow(2, attempts), 10000);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    attempts++;
  }
  
  // 全リトライ失敗
  throw lastError || new Error('Request failed after max retries');
}
```

## セキュリティ考慮事項

Worker間通信におけるセキュリティ考慮事項：

1. **サービストークンの保護**
   - トークン情報は環境変数として保存し、ソースコードに直接含めない
   - 定期的なトークンローテーションを実施（3〜6ヶ月ごと）

2. **最小権限の原則**
   - 必要最小限のアクセス権限のみを付与
   - APIレベルでの細かいアクセス制御実装

3. **リクエスト検証**
   - すべての受信リクエストのソースと内容を検証
   - 予期しないリクエストを拒否する堅牢なバリデーション

4. **CORS設定の厳格化**
   - 許可するオリジンを厳密に制限
   - 必要なヘッダーのみを許可リストに追加

5. **レート制限**
   - APIリクエストにレート制限を適用
   - 大量のリクエストによるリソース枯渇を防止

6. **ログ記録と監視**
   - 重要な通信イベントをログに記録
   - 異常なパターンを検出するためのモニタリング

## 実装パターンと推奨事例

### 1. リクエスト設計パターン

```typescript
// APIクライアントクラス
class ApiClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  
  constructor(env: Env) {
    this.baseUrl = 'https://api.your-domain.workers.dev';
    this.clientId = env.CF_ACCESS_CLIENT_ID;
    this.clientSecret = env.CF_ACCESS_CLIENT_SECRET;
  }
  
  // 認証ヘッダー生成
  private getAuthHeaders(): HeadersInit {
    return {
      'CF-Access-Client-Id': this.clientId,
      'CF-Access-Client-Secret': this.clientSecret,
    };
  }
  
  // GETリクエスト
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    
    if (!response.ok) {
      throw new Error(`API GET request failed: ${response.status}`);
    }
    
    return response.json();
  }
  
  // POSTリクエスト
  async post<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API POST request failed: ${response.status}`);
    }
    
    return response.json();
  }
  
  // 他のHTTPメソッドも同様に実装...
}

// 使用例
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const apiClient = new ApiClient(env);
    
    try {
      // APIからブックマークを取得
      const bookmarks = await apiClient.get<Bookmark[]>('/bookmarks');
      
      return new Response(JSON.stringify({ bookmarks }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

### 2. エラー処理パターン

```typescript
// エラー種別の定義
enum ApiErrorType {
  NETWORK = 'network_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  VALIDATION = 'validation_error',
  SERVER = 'server_error',
  UNKNOWN = 'unknown_error',
}

// APIエラークラス
class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  
  constructor(type: ApiErrorType, message: string, status?: number) {
    super(message);
    this.type = type;
    this.status = status;
    this.name = 'ApiError';
  }
  
  // エラーレスポンスからAPIエラーを生成
  static async fromResponse(response: Response): Promise<ApiError> {
    let message = `HTTP error ${response.status}`;
    let type = ApiErrorType.UNKNOWN;
    
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (e) {
      // JSONパース失敗の場合はテキストを取得
      try {
        message = await response.text();
      } catch (textError) {
        // テキスト取得も失敗した場合はデフォルトメッセージ
      }
    }
    
    // ステータスコードに基づいてエラータイプを設定
    if (response.status === 401) {
      type = ApiErrorType.AUTHENTICATION;
    } else if (response.status === 403) {
      type = ApiErrorType.AUTHORIZATION;
    } else if (response.status === 422 || response.status === 400) {
      type = ApiErrorType.VALIDATION;
    } else if (response.status >= 500) {
      type = ApiErrorType.SERVER;
    }
    
    return new ApiError(type, message, response.status);
  }
}
```

## まとめ

複数のCloudflare Workersが連携するEffective Yomimonoシステムでは、Cloudflare Accessサービストークンを使用することで、安全かつ効率的なWorker間通信を実現できます。フロントエンドからバックエンドへのリクエストは、環境変数として管理されるサービストークンによって認証され、不正アクセスからシステムを保護します。

サービスバインディングの活用やエラー処理戦略の実装により、堅牢なWorker間通信システムを構築できます。セキュリティを重視した設計により、個人利用のシステムであっても、アクセス制御とリソース保護を適切に行うことが可能です。

## 参考リソース

- [Cloudflare Workers フェッチAPI](https://developers.cloudflare.com/workers/runtime-apis/fetch/)
- [Cloudflare Workers サービスバインディング](https://developers.cloudflare.com/workers/platform/bindings/)
- [Cloudflare Access サービストークン](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)
- [Cloudflare Zero Trust アクセス制御](https://developers.cloudflare.com/cloudflare-one/policies/)