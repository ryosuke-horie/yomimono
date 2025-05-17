APIのデプロイは手動で行う

```
npm install
npm run dev
```

```
npm run deploy
```

# drizzleのマイグレーション

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

開発用(wranglerを利用してローカルにマイグレーション)
`npm run migrate:development`

本番用(drizzleを利用して本番にマイグレーション)
`npm run migrate:production`

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
