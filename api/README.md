# APIのデプロイ手順

> **pnpm必須**: `only-allow`でpnpm以外のパッケージマネージャーを拒否しています。以下のコマンドはすべて`pnpm`を前提にしています。

## 開発向けドキュメント

ローカルセットアップやシード、テスト、スクリプト一覧など開発環境での操作は [docs/design/001_開発環境の仕様.md](../docs/design/001_開発環境の仕様.md) に集約しています。そちらを参照してください。

## デプロイ手順

### 1. APIのデプロイ

```bash
pnpm run deploy
```

### 2. データベースマイグレーション

**重要**: CIでの自動マイグレーションは行わず、手動で実行してください。  
自動マイグレーションを行うとデータベースの関連付けが失われる可能性があります。

#### 本番環境へのマイグレーション

1. 安全なマイグレーションスクリプトを使用する（推奨）：
   ```bash
   ./scripts/safe-migrate.sh production
   ```



#### マイグレーション後の検証

```bash
./scripts/validate-migration.sh production
```

### 3. デプロイプロセス

1. **PRのマージ**: `main`ブランチへのマージ時にCIが自動でAPIをデプロイします
2. **手動マイグレーション**: デプロイ完了後、DBマイグレーションを手動で実行してください
3. **検証**: マイグレーション検証スクリプトを実行してデータの整合性を確認します

# Drizzleのマイグレーション

## 安全なマイグレーション手順

### 自動化スクリプトを使用する場合（推奨）

開発環境：
```bash
./scripts/safe-migrate.sh development
```

本番環境：
```bash
./scripts/safe-migrate.sh production
```

このスクリプトは以下を自動で実行します：
1. データベースのバックアップ
2. マイグレーション状態の確認
3. マイグレーションの実行
4. データ整合性のチェック
5. 必要に応じてテストの実行

### 手動で実行する場合

マイグレーションファイル生成
`npx drizzle-kit generate`

マイグレーション適用

本番用(Cloudflare D1 への適用)
`pnpm run migrate:prod:remote`

### マイグレーション検証

マイグレーション後の検証：
```bash
./scripts/validate-migration.sh development  # 開発環境
./scripts/validate-migration.sh production   # 本番環境
```

### 詳細ドキュメント

詳細な手順とベストプラクティスについては、[D1マイグレーションガイド](../docs/調査_設計等/D1マイグレーションガイド.md)を参照してください。

本番DBのデータのコピーを取得する
`npx wrangler d1 export yomimono-db --remote --output=./data.sql --no-schema`

本番DBのデータコピーをローカルに流す
`data.sql`で`__drizzle_migrations`の記述を削除する。
`npx wrangler d1 execute yomimono-db --local --file=data.sql`

## デッドコード検出

Knipを導入しており、未使用のファイルやシンボルを検出できます。定期的に実行し、安全に削除できるかを確認してください。

```bash
pnpm install
pnpm run knip
```
