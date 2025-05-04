# Cloudflare Accessによるアクセス制御の実装計画

## 概要

Effective Yomimonoプロジェクトに対してCloudflare Zero TrustとCloudflare Accessを活用したアクセス制御を実装し、リソース保護とセキュリティ強化を図ります。この実装により、APIやフロントエンドの保護、認証機能の提供、Worker間の安全な通信を実現します。

## 背景

現状、APIとフロントエンドは認証なしで公開されているため、以下の課題があります：

1. Cloudflare Workersの無料枠リソース消費リスク
2. 不正アクセスの可能性
3. 個人利用を目的としたシステムの公開範囲適正化の必要性

Issue #339の調査結果に基づき、Cloudflare Accessを使用したエッジレベルでのアクセス制御が最適な解決策であると判断しました。

## 目標

1. Cloudflare AccessでAPIとフロントエンドを保護し、認証されたアクセスのみ許可
2. フロントエンドからバックエンドへの安全な通信を実現
3. 拡張機能からのアクセスを適切に認証
4. Terraformによる設定の自動化と管理

## 実装計画

### フェーズ1: Cloudflare Zero Trustの基本設定

1. **Zero Trustアカウントの作成**
   - Cloudflare Zero Trustダッシュボードでアカウント作成
   - 無料プランの選択（50ユーザーまで）

2. **アクセス設定の作成**
   - フロントエンド用アプリケーション設定
   - API用アプリケーション設定
   - サービストークンの生成

### フェーズ2: フロントエンドの保護実装

1. **フロントエンドアプリケーションの登録**
   - ユーザー認証方式の設定（Google認証など）
   - アクセスポリシーの設定
   - セッション期間の設定（24時間推奨）

2. **認証後のユーザー体験の最適化**
   - セッション管理の実装
   - ログアウト機能の追加
   - ログイン状態の維持

### フェーズ3: APIの保護実装

1. **APIアプリケーションの登録**
   - サービストークンによる認証設定
   - アクセスポリシーの設定

2. **フロントエンドとの連携**
   - サービストークンの安全な管理
   - APIリクエストへのトークン追加実装
   - エラーハンドリングの改善

### フェーズ4: 拡張機能の対応

1. **拡張機能でのサービストークン管理**
   - トークン保存機能の実装
   - APIリクエストへのトークン追加
   - 設定画面の改善

2. **フロントエンドとの連携**
   - トークン共有メカニズムの検討（オプション）
   - エラーメッセージの改善

### フェーズ5: セキュリティ強化

1. **WAF設定**
   - 基本的な保護ルールの設定
   - ボット対策の設定

2. **レート制限**
   - APIエンドポイントへのレート制限設定
   - 過剰なリクエストの制限

3. **地理的制限**
   - 日本からのアクセスのみ許可する設定

### フェーズ6: Terraformによる自動化

1. **Terraform設定ファイルの作成**
   - アクセスアプリケーション定義
   - アクセスポリシー定義
   - サービストークン管理

2. **CI/CDパイプラインの設定**
   - GitHub Actionsでの自動適用設定
   - シークレット管理の設定

3. **運用手順の確立**
   - サービストークンローテーション手順
   - 設定変更プロセス

## 技術的な詳細

### 認証フロー

1. **フロントエンド認証**
   - ユーザーがフロントエンドにアクセス
   - Cloudflare Access認証画面にリダイレクト
   - 認証成功後、フロントエンドにリダイレクト

2. **API認証**
   - フロントエンドがAPIにリクエスト
   - サービストークンをヘッダーに追加
   - Cloudflare Accessがトークンを検証
   - 有効なトークンの場合、APIにリクエストが到達

### 実装コード例

#### フロントエンドからAPIへのリクエスト

```typescript
// src/lib/api/config.ts
export async function fetchFromApi(path: string, options: RequestInit = {}) {
  const apiUrl = process.env.API_URL;
  const headers = new Headers(options.headers);
  
  // Cloudflare Access認証ヘッダー
  headers.set('CF-Access-Client-Id', process.env.CF_ACCESS_CLIENT_ID);
  headers.set('CF-Access-Client-Secret', process.env.CF_ACCESS_CLIENT_SECRET);
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}
```

#### APIでの認証検証

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono';

export async function validateAccessToken(c: Context, next: Next) {
  const clientId = c.req.header('CF-Access-Client-Id');
  const clientSecret = c.req.header('CF-Access-Client-Secret');
  
  if (!clientId || !clientSecret || 
      clientId !== c.env.CF_ACCESS_CLIENT_ID || 
      clientSecret !== c.env.CF_ACCESS_CLIENT_SECRET) {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  await next();
}
```

### 設定パラメータ

以下の設定パラメータが必要です：

1. **フロントエンド設定**
   - アプリケーション名: `Effective Yomimono Frontend`
   - ドメイン: `app.effective-yomimono.yourdomain.com`
   - セッション期間: `24時間`
   - 認証方法: `Google`（または任意の認証方法）

2. **API設定**
   - アプリケーション名: `Effective Yomimono API`
   - ドメイン: `api.effective-yomimono.yourdomain.com`
   - 認証方法: `サービストークン`

## 作業工数見積もり

| フェーズ | 作業内容 | 見積工数 |
|---------|----------|----------|
| フェーズ1 | Zero Trust基本設定 | 2時間 |
| フェーズ2 | フロントエンド保護実装 | 4時間 |
| フェーズ3 | API保護実装 | 4時間 |
| フェーズ4 | 拡張機能対応 | 6時間 |
| フェーズ5 | セキュリティ強化 | 3時間 |
| フェーズ6 | Terraform自動化 | 8時間 |
| テスト | 総合テストと問題修正 | 6時間 |
| **合計** | | **33時間** |

## 検証方法

1. **フロントエンド認証テスト**
   - 認証なしでのアクセス試行（リダイレクト確認）
   - 認証後のアクセス確認
   - セッション維持の確認

2. **API認証テスト**
   - 認証なしでのAPI直接アクセス試行（拒否確認）
   - フロントエンドからの認証付きリクエスト確認
   - 不正なトークンでのリクエスト試行

3. **拡張機能テスト**
   - トークン設定機能の確認
   - API連携の確認
   - エラー処理の確認

## リスクと軽減策

1. **移行時の影響**
   - **リスク**: 既存ユーザーが突然アクセスできなくなる
   - **軽減策**: 段階的な移行とクロスオーバー期間の設定

2. **拡張機能の互換性**
   - **リスク**: 既存の拡張機能が機能しなくなる
   - **軽減策**: 慎重なテストと後方互換性の確保

3. **依存関係のリスク**
   - **リスク**: Cloudflareサービスの障害時にアクセス不能
   - **軽減策**: 重要な運用手順の文書化と代替アクセス方法の検討

4. **コスト増加リスク**
   - **リスク**: 将来のCloudflare料金体系変更
   - **軽減策**: コスト上限の設定と定期的な使用状況の監視

## 結論

Cloudflare AccessによるEffective Yomimonoの保護は、リソース消費問題に対する効果的な解決策です。エッジレベルでのフィルタリングにより、Workersへの不要なアクセスを防ぎ、個人利用に適した保護を実現します。

この実装により以下のメリットが得られます：

1. Cloudflare Workersの無料枠リソース消費リスクの大幅な低減
2. 認証によるアクセス制御
3. フロントエンドとAPIの安全な通信
4. Terraformによる設定の一元管理

本ドキュメントが新たなIssueとして登録され、実装の出発点となることを期待します。