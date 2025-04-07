# Effective Yomimono 認証システム設計

このディレクトリには、Effective Yomimono プロジェクトに認証機能を導入するための計画、ガイド、調査結果が含まれています。

## 目的

個人利用のWebアプリケーションとして、以下の目的から認証機能を導入します：

1. **Cloudflare Workersのリソース保護**: 無料枠の消費を防ぐため、意図しないアクセスやボットからのアクセスを制限
2. **個人データの保護**: 自分だけのブックマークデータへのアクセスを制限
3. **拡張機能との安全な連携**: ブラウザ拡張機能とAPIの安全な通信を確保

## ドキュメント一覧

1. [**Cloudflare Access調査結果**](./cloudflare_access.md) - Cloudflare Accessの機能、料金、実装方法の調査
2. [**多層防御アプローチ**](./multi_layer_defense.md) - ネットワーク層とアプリケーション層を組み合わせた防御戦略
3. [**拡張機能連携ガイド**](./extension_integration.md) - ブラウザ拡張機能との認証連携方法

## 実装アプローチ

Effective Yomimono に認証システムを導入するための主なアプローチ：

1. **Cloudflare Accessによるネットワーク層保護**:
   - エッジレベルでの認証と認可
   - Workersリソースの消費を事前に防止

2. **JWTベースのバックアップ認証**:
   - アプリケーション層での軽量認証
   - 拡張機能との連携のため

3. **多層防御の実現**:
   - WAFとレート制限の設定
   - 地理的アクセス制限の適用

## 技術スタック

- **Cloudflare Access**: ネットワーク層での認証
- **Hono.js JWT Middleware**: アプリケーション層での認証
- **Cloudflare WAF**: セキュリティ強化
- **Browser Storage API**: 拡張機能での認証情報管理

## 実装ステップ

1. Cloudflare Accessの設定
2. カスタムドメインの導入
3. WAFとセキュリティルールの設定
4. バックアップJWT認証の実装
5. 拡張機能の更新
6. テスト実装

## 関連するADR

- [ADR-001: リソース保護のための認証機能実装](/Users/r-horie/private/effective-yomimono/docs/ADR/001-リソース保護に関して.md)
- [ADR-002: ネットワーク層でのリソース保護対策](/Users/r-horie/private/effective-yomimono/docs/ADR/002-ネットワーク層でのリソース保護.md)

## 参考リソース

- [Cloudflare Access 公式ページ](https://www.cloudflare.com/zero-trust/products/access/)
- [Zero Trust開発者ドキュメント](https://developers.cloudflare.com/cloudflare-one/)
- [Hono.js JWT Middleware](https://github.com/honojs/middleware/tree/main/packages/jwt)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
