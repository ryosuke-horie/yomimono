# Cloudflare WorkersとCloudflare Accessの連携ガイド

## 概要

この文書では、Effective Yomimonoプロジェクトのバックエンド（Cloudflare Workers）とフロントエンド（Next.js + Cloudflare Workers）をCloudflare Accessによって保護し、認証・認可を実装する方法について詳述します。また、保護されたワーカー間での通信における認証の実装方法についても解説します。

## ワーカー保護の基本的なアプローチ

Cloudflare Workersに対してCloudflare Accessによる保護をかける主な方法には以下があります：

1. **Self-Hosted Application（セルフホストアプリケーション）として登録**
   - Cloudflare Zero Trustダッシュボードでセルフホストアプリケーションとして登録
   - カスタムドメインまたはWorkers専用ドメインを指定
   - アクセスポリシーを設定

2. **サービストークンを利用したAPI保護**
   - APIエンドポイント（バックエンドワーカー）をサービストークンで保護
   - フロントエンド（Next.js）からのリクエストにサービストークンを付与

## 実装手順

### 1. Cloudflare Zero Trustアカウントの設定

1. Cloudflareアカウントにログイン
2. Zero Trustダッシュボードにアクセス（`https://dash.teams.cloudflare.com/`）
3. 新しいZero Trustアカウントを作成（未作成の場合）
4. チーム名を設定し、無料プランを選択（50ユーザーまで利用可能）

### 2. フロントエンドアプリケーションの保護設定

フロントエンド（Next.js + Cloudflare Workers）を認証で保護するための設定：

1. Zero Trustダッシュボードで「Access」→「Applications」を選択
2. 「Add an application」をクリック
3. 「Self-hosted」を選択
4. アプリケーション名（例：`Effective Yomimono Frontend`）を入力
5. ドメイン設定：
   - カスタムドメイン（例：`app.effective-yomimono.yourdomain.com`）または
   - Workers専用ドメイン（例：`frontend.your-project.workers.dev`）を指定
6. セッション設定（推奨）：
   - セッション持続時間：24時間（必要に応じて調整可能）
   - セッション更新時間：1時間（必要に応じて調整可能）
7. 「Next」をクリックしてポリシー設定に進む

#### フロントエンドアクセスポリシーの設定

1. ポリシー名を設定（例：「Frontend Access Policy」）
2. 「Configure rules」セクションで認証方法を選択：
   - 「Authenticated users」を選択（特定のユーザーのみに制限したい場合）
   - 特定のユーザーにのみ許可する場合は「Include」セクションで「Emails」を選択
   - メールアドレスを指定（例：`your-email@example.com`）
3. 認証方法を「Add a provider」から設定（Google, GitHub, One-time PINなど）
4. 「Next」をクリックして作成を完了

### 3. バックエンドAPI（Workers）の保護設定

1. Zero Trustダッシュボードで「Access」→「Applications」を選択
2. 「Add an application」をクリック
3. 「Self-hosted」を選択
4. アプリケーション名（例：`Effective Yomimono API`）を入力
5. ドメイン設定：
   - APIのドメイン（例：`api.effective-yomimono.yourdomain.com`）または
   - Workers専用ドメイン（例：`api.your-project.workers.dev`）を指定
6. 「Next」をクリックしてポリシー設定に進む

#### サービストークンによるAPI保護の設定

API（バックエンドワーカー）をサービストークンで保護するための設定：

1. 「Add a policy」をクリック
2. ポリシー名を設定（例：「API Service Token Policy」）
3. 「Include」セクションで「Service auth」を選択
4. 「Next」をクリックして作成を完了

### 4. サービストークンの生成

1. Zero Trustダッシュボードで「Access」→「Service Auth」を選択
2. 「Create a service token」をクリック
3. トークン名を設定（例：`frontend-to-api-token`）
4. 「Generate token」をクリック
5. 生成されたClient IDとClient Secretを安全に保存
   - 重要: Client Secretは表示された時に必ずコピーし保存する（再表示はできません）

### 5. フロントエンドからバックエンドへのアクセス実装

フロントエンド（Next.js）からバックエンドAPI（Workers）へのリクエスト時に、サービストークンを付与するための実装：

```typescript
// src/lib/api/config.ts

// 環境変数からサービストークン情報を取得
const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID;
const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET;

// APIクライアントの設定
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    // Cloudflare Accessの認証ヘッダーを追加
    'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // エラーハンドリング
    const error = await response.text();
    throw new Error(`API request failed: ${error}`);
  }

  return response.json();
}
```

### 6. 環境変数の設定

Next.jsフロントエンドの環境変数設定（`.env.local`または環境変数）：

```dotenv
# Cloudflare Access認証情報
CF_ACCESS_CLIENT_ID=your-client-id
CF_ACCESS_CLIENT_SECRET=your-client-secret
```

Cloudflare Workersの環境変数設定（Wrangler設定またはCloudflareダッシュボード）：

```
# wrangler.toml 設定例（本番環境に反映させる場合はWranglerのsecret機能を使用）
[vars]
CF_ACCESS_CLIENT_ID = "your-client-id"
CF_ACCESS_CLIENT_SECRET = "your-client-secret"
```

### 7. 拡張機能からのAPIアクセス実装

Chrome拡張機能からバックエンドAPI（Workers）へのリクエスト時にサービストークンを付与する実装：

```javascript
// background.js

// サービストークン情報を保存
let cfAccessClientId = '';
let cfAccessClientSecret = '';

// ストレージから認証情報を読み込み
chrome.storage.local.get(['cf_access_client_id', 'cf_access_client_secret'], (result) => {
  if (result.cf_access_client_id && result.cf_access_client_secret) {
    cfAccessClientId = result.cf_access_client_id;
    cfAccessClientSecret = result.cf_access_client_secret;
  }
});

// 認証付きAPIリクエスト関数
async function fetchWithAuth(url, options = {}) {
  if (!cfAccessClientId || !cfAccessClientSecret) {
    throw new Error('認証トークンが設定されていません');
  }

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    // Cloudflare Accessの認証ヘッダーを追加
    'CF-Access-Client-Id': cfAccessClientId,
    'CF-Access-Client-Secret': cfAccessClientSecret,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

// 例: ブックマークを保存するAPI呼び出し
async function saveBookmarks(bookmarks) {
  return fetchWithAuth('https://api.effective-yomimono.yourdomain.com/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ bookmarks }),
  });
}

// メッセージハンドラー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveBookmarks') {
    saveBookmarks(request.bookmarks)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 非同期応答のためtrueを返す
  }
});
```

### 8. サービストークンのセキュリティ対策

サービストークンは機密情報であるため、以下のセキュリティ対策を実施することが重要です：

1. **環境変数としての管理**
   - トークン情報はソースコードに直接埋め込まない
   - Cloudflare Workersの環境変数やシークレットとして管理
   - Next.jsの場合は`.env.local`ファイルに保存しGitリポジトリにコミットしない

2. **定期的なトークンローテーション**
   - 3〜6ヶ月ごとにトークンを再生成
   - 古いトークンを無効化する前に新しいトークンに移行

3. **最小権限の原則**
   - 必要最小限のアクセス権限のみを付与

4. **監査とモニタリング**
   - Zero Trustダッシュボードでアクセスログを定期的に確認
   - 不審なアクセスパターンを検出

## Cloudflare Workersでのアクセス検証実装

バックエンドWorkers内でCloudflare Accessの認証情報を検証するミドルウェア実装：

```typescript
// src/middleware/cfAccessAuth.ts
import { Context, Next } from 'hono';

export async function cfAccessAuthMiddleware(c: Context, next: Next) {
  // リクエストからCloudflare Accessヘッダーを取得
  const clientId = c.req.header('CF-Access-Client-Id');
  const clientSecret = c.req.header('CF-Access-Client-Secret');
  
  // 環境変数から正しい認証情報を取得
  const validClientId = c.env.CF_ACCESS_CLIENT_ID;
  const validClientSecret = c.env.CF_ACCESS_CLIENT_SECRET;
  
  // 認証情報の検証
  if (!clientId || !clientSecret || 
      clientId !== validClientId || 
      clientSecret !== validClientSecret) {
    return c.json({ 
      success: false, 
      message: 'アクセスが拒否されました。有効な認証情報が必要です。' 
    }, 403);
  }
  
  // 認証成功した場合は次のミドルウェアへ
  await next();
}
```

Hono.jsルーターへの適用：

```typescript
import { Hono } from 'hono';
import { cfAccessAuthMiddleware } from './middleware/cfAccessAuth';

const app = new Hono();

// 認証を必要とするすべてのエンドポイントに適用
app.use('/*', cfAccessAuthMiddleware);

// APIルートの定義
app.get('/bookmarks', (c) => {
  // 認証済みリクエストのみここに到達
  return c.json({ success: true, message: 'Authenticated request' });
});

export default app;
```

## Terraformでの管理

Cloudflare AccessをTerraformで管理する基本的な方法：

1. **必要なTerraformプロバイダーの設定**

```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

2. **Cloudflare Accessアプリケーションの定義**

```hcl
resource "cloudflare_access_application" "frontend" {
  zone_id          = var.cloudflare_zone_id
  name             = "Effective Yomimono Frontend"
  domain           = "app.effective-yomimono.yourdomain.com"
  session_duration = "24h"
}

resource "cloudflare_access_application" "api" {
  zone_id          = var.cloudflare_zone_id
  name             = "Effective Yomimono API"
  domain           = "api.effective-yomimono.yourdomain.com"
  session_duration = "24h"
}
```

3. **アクセスポリシーの定義**

```hcl
# フロントエンド用のアクセスポリシー（メールベース）
resource "cloudflare_access_policy" "frontend_policy" {
  application_id = cloudflare_access_application.frontend.id
  zone_id        = var.cloudflare_zone_id
  name           = "Frontend Access Policy"
  precedence     = 1
  decision       = "allow"

  include {
    email = ["your-email@example.com"]
  }
}

# API用のサービストークンポリシー
resource "cloudflare_access_policy" "api_policy" {
  application_id = cloudflare_access_application.api.id
  zone_id        = var.cloudflare_zone_id
  name           = "API Service Token Policy"
  precedence     = 1
  decision       = "allow"

  include {
    service_token = [cloudflare_access_service_token.api_token.id]
  }
}
```

4. **サービストークンの生成**

```hcl
# サービストークンの生成
resource "cloudflare_access_service_token" "api_token" {
  account_id = var.cloudflare_account_id
  name       = "frontend-to-api-token"
}

# トークン情報の出力
output "service_token_id" {
  value     = cloudflare_access_service_token.api_token.client_id
  sensitive = true
}

output "service_token_secret" {
  value     = cloudflare_access_service_token.api_token.client_secret
  sensitive = true
}
```

5. **変数定義**

```hcl
variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}
```

## 考慮事項とリスク

1. **サービス依存性**
   - Cloudflare Accessの可用性に依存するため、Cloudflareの障害時にサービスが利用できなくなる可能性
   - 緊急時のバックアッププランを検討することが重要

2. **サービストークンの管理**
   - トークン情報の漏洩リスク
   - 定期的なローテーションと安全な保存が必須

3. **CORS設定の複雑さ**
   - クロスドメイン通信における正しいCORS設定が必要
   - Cloudflare Accessの認証ヘッダーを許可するよう構成が必要

4. **拡張機能との連携**
   - ブラウザ拡張機能でのトークン管理の複雑さ
   - トークン情報の安全な保存方法の検討

5. **価格と制限**
   - 現在は無料プランで十分だが、将来的な料金体系や利用制限の変更可能性

## まとめ

Cloudflare WorkersとCloudflare Accessを連携させることで、エッジレベルでの強力なアクセス制御を実現し、リソース消費を最小限に抑えることができます。サービストークンを活用することで、フロントエンドとバックエンドのAPIコミュニケーションをセキュアに保ちながら、認証済みユーザーのみがシステムを利用できる環境を構築できます。

この実装方法は、個人プロジェクトであるEffective Yomimonoの特性に適しており、無料プランの範囲内で十分な保護を提供します。また、将来的な拡張性も確保されています。

## 参考リソース

- [Cloudflare Zero Trust ドキュメント](https://developers.cloudflare.com/cloudflare-one/)
- [Cloudflare Access アプリケーション設定](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/)
- [サービストークンドキュメント](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)
- [Terraform Cloudflareプロバイダー](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)