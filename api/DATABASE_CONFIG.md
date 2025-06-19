# データベース設定ガイド

## 概要

このプロジェクトでは、環境変数 `NODE_ENV` に基づいて開発環境と本番環境でそれぞれ異なるデータベースを使用します。

## 環境分離

### 開発環境 (`NODE_ENV=development` または未設定)
- **データベース**: ローカルSQLiteファイル (`sqlite.db`)
- **データベース名**: `yomimono-db-dev`
- **場所**: プロジェクトルート
- **用途**: ローカル開発、テスト、マイグレーション
- **注意**: `wrangler dev` 実行時は `.wrangler` 内のminiflareD1を使用

### 本番環境 (`NODE_ENV=production`)
- **データベース**: Cloudflare D1 (`wrangler://yomimono-db`)
- **データベース名**: `yomimono-db`
- **用途**: 本番デプロイ

## 使用方法

### 開発時
```bash
# 開発サーバー起動
npm run dev

# 開発環境マイグレーション実行
npm run migrate:development

# ローカルD1データベースにマイグレーション適用
npm run migrate:dev:local

# 開発環境用Drizzle Studio起動
npm run db:studio:dev
```

### 本番環境
```bash
# 本番デプロイ
npm run deploy

# 本番環境マイグレーション実行
npm run migrate:production

# 本番D1データベースにマイグレーション適用
npm run migrate:prod:remote

# 本番環境用Drizzle Studio起動
npm run db:studio:prod
```

### その他のコマンド
```bash
# マイグレーションファイル生成
npm run db:generate

# デフォルトDrizzle Studio（NODE_ENVに基づく）
npm run db:studio
```

## 設定ファイル

### drizzle.config.ts
環境変数に基づいて適切なデータベースURLを自動選択します：
- 開発環境: `sqlite.db`
- 本番環境: `wrangler://yomimono-db`

### wrangler.jsonc
- 本番環境: `d1_databases` セクションで本番用D1データベース設定
- 開発環境: `dev.d1_databases` セクションで開発用ローカルD1データベース設定

### src/config/database.ts
データベース設定を管理するユーティリティモジュール：
```typescript
import { getCurrentDatabaseConfig } from './src/config/database';

const config = getCurrentDatabaseConfig();
console.log(config.environment); // "development" or "production"
console.log(config.url);         // データベースURL
console.log(config.databaseName); // データベース名
```

## 環境変数

### .env ファイル例
```env
# 環境設定（development または production）
NODE_ENV=development

# Cloudflare関連設定（本番環境用）
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_DATABASE_ID=your_database_id_here
CLOUDFLARE_D1_TOKEN=your_d1_token_here
```

## 安全性の考慮

1. **完全分離**: 開発環境と本番環境のデータベースは完全に分離されています
2. **自動選択**: 環境変数に基づいて自動的に適切な設定が選択されます
3. **フォールバック**: NODE_ENVが未設定の場合は安全に開発環境設定を使用します

## トラブルシューティング

### よくある問題と解決方法

1. **マイグレーションが適用されない**
   - 正しい環境変数が設定されているか確認
   - 適切なマイグレーションコマンドを使用しているか確認

2. **データベース接続エラー**
   - Cloudflare認証情報が正しく設定されているか確認（本番環境）
   - ローカルSQLiteファイルの権限を確認（開発環境）

3. **環境が正しく認識されない**
   - NODE_ENV環境変数が正しく設定されているか確認
   - `npm run dev` 時は自動的に `NODE_ENV=development` が設定されます

## テスト

データベース設定の正常性は以下のテストで確認できます：

```bash
# 設定ユーティリティのテストを実行
npx vitest run src/config/database.ts

# 全テストを実行（設定が正しく動作するか確認）
npm run test
```