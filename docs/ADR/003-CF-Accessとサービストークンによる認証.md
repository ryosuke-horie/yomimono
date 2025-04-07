# ADR 003: Cloudflare Accessとサービストークンによるクロスドメイン認証

## 日時

2025-04-07

## ステータス

承認済み

## コンテキスト

ADR-002では、Cloudflare Accessを使用したネットワーク層での多層防御アプローチを採用することを決定した。しかし、Effective Yomimonoのアーキテクチャでは、フロントエンドとバックエンドAPIが別々のCloudflare Workersドメイン（無料ドメイン）で運用されている：

- フロントエンド: `frontend-xyz.workers.dev`などの無料ドメイン
- バックエンドAPI: `api-xyz.workers.dev`などの別の無料ドメイン

このドメイン分割構成に対して、以下の課題が明らかになった：

1. Cloudflare Accessの認証cookieはドメイン間で共有されない
2. フロントエンドアプリからAPIへのリクエストで認証情報が失われる
3. ブラウザ拡張機能からのAPIリクエストも同様に認証が必要
4. 同一オリジンポリシーによるクロスドメインの制限

個人利用のプロジェクトであるため、コスト効率と実装の容易さを維持しながら、Cloudflare Workersのリソース保護という主要目標を達成する方法を検討する必要がある。

## 決定

**Cloudflare AccessのサービストークンをAPIアクセスに使用する方式を採用する。**

具体的には：

1. **Cloudflare Accessによる両アプリケーションの保護**:
   - フロントエンドアプリケーションをCloudflare Accessで保護（ユーザー認証）
   - バックエンドAPIもCloudflare Accessで保護（サービストークン認証）

2. **APIアクセス用サービストークンの作成**:
   - Cloudflare Zero Trustダッシュボードでサービストークンを生成
   - クライアントIDとシークレットを取得

3. **フロントエンドからのAPI通信**:
   - フロントエンドコードにサービストークンを組み込み
   - APIリクエスト時にヘッダーでサービストークンを送信

4. **ブラウザ拡張機能からのAPI通信**:
   - 拡張機能コードにもサービストークンを組み込み
   - APIリクエスト時に同じヘッダーを使用

5. **セキュリティ強化**:
   - WAFルールとレート制限の設定
   - 地理的アクセス制限の適用

## 根拠

この決定の主な根拠：

1. **実装の容易さ**: サービストークン方式は、JWT実装などと比較して実装が容易であり、コードの変更が最小限で済む
2. **既存のインフラ活用**: 現状のドメイン分割アーキテクチャを変更する必要がない
3. **コスト効率**: 無料プランで実現可能であり、追加費用が発生しない
4. **セキュリティ**: Cloudflareのエッジレベルで認証を行うため、Workersリソースの消費を効果的に防ぐという主目的を達成できる
5. **一貫性**: フロントエンドと拡張機能で同じ認証方式を使用できる

## 結果

この決定により、以下の結果が予想される：

### ポジティブな結果

1. Cloudflare Workersのリソース消費が効果的に制限される
2. フロントエンドとAPIの分離アーキテクチャを維持しながら安全な通信が可能になる
3. 拡張機能との連携が容易になる
4. 実装が比較的シンプルで、短期間で導入できる

### ネガティブな結果

1. サービストークンがコードに埋め込まれるため、漏洩リスクがある
2. フロントエンドアプリのクライアントサイドJavaScriptにサービストークンが含まれる
3. トークンローテーション時に両方のアプリケーションを更新する必要がある

### 中立的な結果

1. 認証ロジックがCloudflareサービスに依存する
2. フロントエンドとAPIの両方でCloudflare Accessの設定が必要

## オプションと代替案

検討した代替案は以下の通り：

1. **カスタムドメインへの移行**:
   - メリット: 同一ルートドメイン下でCookie共有が可能になり、認証が簡素化される
   - デメリット: ドメイン取得費用が発生し、DNS設定などの追加作業が必要

2. **JWTベースの独自認証実装**:
   - メリット: Cloudflare Accessと独立した認証が可能になる
   - デメリット: 実装が複雑になり、Workersリソース消費の問題が残る

3. **APIとフロントエンドの統合**:
   - メリット: ドメイン間通信の問題が解消される
   - デメリット: アーキテクチャの大幅な変更が必要で、関心の分離が損なわれる

4. **アクセスを保護せずにWAFのみで制限**:
   - メリット: 実装がさらに簡単になる
   - デメリット: 悪意あるトラフィックの防止が不十分になる

## 実装詳細

### 1. Cloudflare Accessの設定

1. **両アプリケーションの登録**:
   - フロントエンド: ユーザー認証（Google、GitHub等）を設定
   - API: サービストークン認証を許可

2. **サービストークンの生成**:
   - Zero Trustダッシュボードで「Access」→「Service Auth」に移動
   - 新しいサービストークンを作成（名前: `effective-yomimono-api-access`）
   - クライアントIDとシークレットを安全に保存

### 2. フロントエンドの実装

```javascript
// APIクライアントユーティリティ
const API_BASE_URL = 'https://api-xyz.workers.dev';
const CF_ACCESS_CLIENT_ID = 'your-client-id';
const CF_ACCESS_CLIENT_SECRET = 'your-client-secret';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

// 使用例
async function getBookmarks() {
  return await apiRequest('/bookmarks');
}

async function saveBookmark(bookmark) {
  return await apiRequest('/bookmarks', 'POST', bookmark);
}
```

### 3. ブラウザ拡張機能の実装

```javascript
// 拡張機能のバックグラウンドスクリプト
const API_BASE_URL = 'https://api-xyz.workers.dev';
const CF_ACCESS_CLIENT_ID = 'your-client-id';
const CF_ACCESS_CLIENT_SECRET = 'your-client-secret';

// タブからブックマークを収集して保存
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveBookmarks') {
    saveBookmarks(request.bookmarks)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 非同期レスポンスを示す
  }
});

async function saveBookmarks(bookmarks) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookmarks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET
      },
      body: JSON.stringify({ bookmarks })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    throw error;
  }
}
```

### 4. セキュリティ強化措置

1. **環境変数の利用**:
   - 本番環境ではサービストークンを環境変数として設定
   - デプロイプロセスで環境変数を組み込む

2. **トークンのローテーション計画**:
   - 定期的（例：3-6ヶ月ごと）にサービストークンを更新
   - 更新はフロントエンドと拡張機能の同時デプロイで行う

3. **WAFルールの設定**:
   - レート制限を適用して大量リクエストを防止
   - 地理的制限を設定して使用国からのアクセスのみを許可

## 注記

サービストークン方式は実装の容易さと効果のバランスが良い選択だが、以下の点に留意する必要がある：

1. サービストークンはクライアントサイドコードに含まれるため、完全な安全性は確保できない。これは個人利用のプロジェクトにおける許容可能なトレードオフとする。

2. 将来的に利用パターンや要件が変わった場合は、カスタムドメインへの移行やより堅牢な認証システムの導入を検討する。

3. Cloudflareのサービス依存度が高まるため、サービス停止時の影響を認識しておく。
