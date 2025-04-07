# 認証システム実装ガイド

## はじめに

この文書では、Effective Yomimono プロジェクトに認証システムを実装するための詳細なガイドを提供します。現在、アプリケーションは認証なしで公開されているため、個人使用に特化したシンプルかつ効果的な認証メカニズムを導入します。

## 認証システムの概要

### 認証システムの要件

Effective Yomimono の認証システムに求められる主な要件：

1. **シンプルさ** - 個人利用のためにシンプルで保守しやすい設計
2. **自己完結性** - DB保存を最小限にした、コードベースで完結する設計
3. **セキュアな通信** - API通信におけるセキュリティの確保
4. **複数デバイス対応** - 異なるデバイスからのアクセスをサポート
5. **拡張機能との連携** - ブラウザ拡張機能とのシームレスな連携

### 使用する技術とアプローチ

提案する認証システムは以下の技術とアプローチに基づいています：

1. **JWT (JSON Web Tokens)** - ステートレスな認証トークンを利用
2. **環境変数ベースのシークレット管理** - 認証情報は環境変数で管理
3. **Honoミドルウェア** - JWT検証ミドルウェアを活用
4. **ローカルストレージ** - クライアント側でのトークン保存
5. **CORS設定** - 適切なオリジン制限

## 認証フロー

### 基本的な認証フロー

1. ユーザーがフロントエンドでログインフォームに認証情報を入力
2. フロントエンドがAPIの認証エンドポイントにリクエストを送信
3. APIが認証情報を検証し、有効であればJWTを発行
4. フロントエンドがJWTを保存し、以降のAPIリクエストに添付
5. APIがJWTを検証し、リクエストを処理または拒否

### 拡張機能での認証フロー

1. ユーザーが拡張機能にトークンを設定（手動または連携機能を介して）
2. 拡張機能がリンク収集時にトークンをAPIリクエストに添付
3. APIがトークンを検証し、リクエストを処理または拒否

## 詳細な実装ガイド

### 1. API側の認証システム実装

#### 1.1. 必要なパッケージのインストール

```bash
# Hono.jsプロジェクトでのインストール例
npm install hono @hono/jwt
```

#### 1.2. 環境変数の設定

```env
# .env または Cloudflare環境変数
JWT_SECRET=your-secure-random-secret-key
AUTH_USERNAME=your-username
AUTH_PASSWORD=your-password
```

#### 1.3. 認証エンドポイントの実装

```typescript
// src/api/auth.ts
import { Hono } from 'hono';
import { sign } from '@hono/jwt';

const authApp = new Hono();

// 認証エンドポイント
authApp.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // 環境変数から認証情報を取得
  const validUsername = c.env.AUTH_USERNAME;
  const validPassword = c.env.AUTH_PASSWORD;
  
  // 認証情報の検証
  if (username !== validUsername || password !== validPassword) {
    return c.json({ success: false, message: '認証情報が無効です' }, 401);
  }
  
  // JWTの生成
  const token = await sign({
    id: 'personal-user',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30日間有効
  }, c.env.JWT_SECRET);
  
  return c.json({ success: true, token });
});

export default authApp;
```

#### 1.4. JWT検証ミドルウェアの実装

```typescript
// src/api/middleware/auth.ts
import { Context, Next } from 'hono';
import { verify } from '@hono/jwt';

export async function authMiddleware(c: Context, next: Next) {
  // Authorizationヘッダーの取得
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '認証が必要です' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    // JWTの検証
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ success: false, message: '無効なトークンです' }, 401);
  }
}
```

#### 1.5. APIルートへのミドルウェア適用

```typescript
// src/api/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import authApp from './auth';
import bookmarksApp from './bookmarks';

const app = new Hono();

// CORSの設定
app.use('/*', cors({
  origin: ['https://your-frontend-domain.workers.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}));

// 認証ルートのマウント（認証不要）
app.route('/auth', authApp);

// 認証が必要なルートに認証ミドルウェアを適用
app.use('/bookmarks/*', authMiddleware);
app.route('/bookmarks', bookmarksApp);

export default app;
```

### 2. フロントエンド側の認証実装

#### 2.1. 認証コンテキストの作成

```typescript
// src/context/auth.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 初期化時にローカルストレージからトークンを読み込み
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);
  
  // ログイン処理
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('https://your-api.workers.dev/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
```

#### 2.2. API呼び出しユーティリティ

```typescript
// src/utils/api.ts
import { useAuth } from '../context/auth';

// 認証APIクライアント
export function useApiClient() {
  const { token, logout } = useAuth();
  
  const apiCall = async (
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // トークンがある場合はヘッダーに追加
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`https://your-api.workers.dev${endpoint}`, options);
    
    // 認証エラーの場合はログアウト
    if (response.status === 401) {
      logout();
      throw new Error('認証エラー: 再ログインが必要です');
    }
    
    return response.json();
  };
  
  return {
    get: (endpoint: string) => apiCall(endpoint),
    post: (endpoint: string, data: any) => apiCall(endpoint, 'POST', data),
    put: (endpoint: string, data: any) => apiCall(endpoint, 'PUT', data),
    patch: (endpoint: string, data: any) => apiCall(endpoint, 'PATCH', data),
    delete: (endpoint: string) => apiCall(endpoint, 'DELETE'),
  };
}
```

#### 2.3. 認証ルートガード

```typescript
// src/components/AuthRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

interface AuthRouteProps {
  children: ReactNode;
}

export function AuthRoute({ children }: AuthRouteProps) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

#### 2.4. ルーティング設定

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth';
import { AuthRoute } from './components/AuthRoute';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import BookmarksPage from './pages/Bookmarks';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AuthRoute><HomePage /></AuthRoute>} />
          <Route path="/bookmarks" element={<AuthRoute><BookmarksPage /></AuthRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 3. 拡張機能での認証実装

#### 3.1. トークン設定画面

```typescript
// src/options.tsx (拡張機能の設定画面)
import { useState, useEffect } from 'react';

function OptionsPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  
  // 保存済みのトークンを読み込み
  useEffect(() => {
    chrome.storage.local.get(['auth_token'], (result) => {
      if (result.auth_token) {
        setToken(result.auth_token);
      }
    });
  }, []);
  
  // トークンの保存
  const saveToken = () => {
    chrome.storage.local.set({ auth_token: token }, () => {
      setStatus('トークンを保存しました');
      setTimeout(() => setStatus(''), 3000);
    });
  };
  
  return (
    <div className="container">
      <h1>Effective Yomimono 設定</h1>
      <div className="form-group">
        <label htmlFor="token">認証トークン:</label>
        <input
          type="text"
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="JWT認証トークンを入力"
        />
      </div>
      <button onClick={saveToken}>保存</button>
      {status && <div className="status">{status}</div>}
    </div>
  );
}
```

#### 3.2. API呼び出しでのトークン使用

```typescript
// src/background.ts (拡張機能のバックグラウンドスクリプト)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveBookmarks') {
    saveBookmarks(request.bookmarks)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 非同期応答を示す
  }
});

async function saveBookmarks(bookmarks) {
  // トークンの取得
  const storage = await chrome.storage.local.get(['auth_token']);
  const token = storage.auth_token;
  
  if (!token) {
    throw new Error('認証トークンが設定されていません');
  }
  
  const response = await fetch('https://your-api.workers.dev/bookmarks/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ bookmarks })
  });
  
  return response.json();
}
```

## トークン共有メカニズム

フロントエンドと拡張機能でトークンを共有するための方法として、以下の2つのアプローチが考えられます：

### アプローチ1: 手動コピー

最もシンプルな方法は、フロントエンドからトークンを手動でコピーして拡張機能に貼り付けることです：

1. フロントエンドにトークン表示画面を追加
2. ユーザーがトークンをコピー
3. 拡張機能の設定画面でトークンを貼り付け

```typescript
// フロントエンドのトークン表示コンポーネント
function TokenDisplay() {
  const { token } = useAuth();
  
  const copyToken = () => {
    navigator.clipboard.writeText(token || '');
    alert('トークンをクリップボードにコピーしました');
  };
  
  return (
    <div className="token-display">
      <h3>拡張機能用認証トークン</h3>
      <p>以下のトークンを拡張機能の設定画面に貼り付けてください:</p>
      <div className="token-container">
        <code>{token}</code>
      </div>
      <button onClick={copyToken}>コピー</button>
    </div>
  );
}
```

### アプローチ2: クリップボードAPI連携

より高度な方法は、フロントエンドから拡張機能に直接トークンを送信する機能を実装することです：

1. フロントエンドに拡張機能連携ボタンを設置
2. ボタンクリック時にカスタムイベントを発火
3. 拡張機能のコンテンツスクリプトがイベントをリッスンしてトークンを保存

```typescript
// フロントエンドの連携コンポーネント
function ExtensionSync() {
  const { token } = useAuth();
  
  const syncWithExtension = () => {
    // カスタムイベントの発火
    const event = new CustomEvent('effective-yomimono-sync', {
      detail: { token }
    });
    document.dispatchEvent(event);
  };
  
  return (
    <button onClick={syncWithExtension}>
      拡張機能と連携する
    </button>
  );
}

// 拡張機能のコンテンツスクリプト
document.addEventListener('effective-yomimono-sync', function(event) {
  const token = event.detail.token;
  chrome.storage.local.set({ auth_token: token }, () => {
    alert('トークンが同期されました');
  });
});
```

## セキュリティ考慮事項

認証システムを実装する際の主なセキュリティ考慮事項：

1. **強力なJWTシークレット**: ランダムで十分に長いシークレットを使用する
2. **適切なトークン有効期限**: 長期間使用する場合でも定期的な再認証を検討
3. **HTTPS通信**: すべての通信をHTTPS経由で行う
4. **CORS設定**: 適切なオリジン制限を設定し、不正なクロスサイトリクエストを防止
5. **環境変数管理**: 認証情報は安全に管理し、コードベースに含めない
6. **トークンの安全な保存**: クライアント側でのトークン保存方法を考慮

より詳細なセキュリティ考慮事項については、[セキュリティ考慮事項](./security_considerations.md)ドキュメントを参照してください。

## まとめ

この実装ガイドでは、Effective Yomimono プロジェクトに認証システムを導入するための詳細な手順を提供しました。JWTベースの認証システムは、個人利用に特化したシンプルで効果的なアプローチです。

このアプローチの利点：

1. **シンプルな実装**: 既存のインフラやコードベースへの影響を最小限に抑える
2. **ステートレス設計**: DBに認証情報を保存する必要がない
3. **高いセキュリティ**: 適切に実装すれば、個人利用に十分なセキュリティレベルを提供
4. **拡張性**: 将来的な機能拡張に対応可能な基盤を提供

次のステップとして、[サンプル実装](./sample_implementation.md)を参照して、具体的なコード例を確認してください。
