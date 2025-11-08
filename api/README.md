# APIのデプロイ手順

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

1. `pnpm run migrate:prod:remote` を実行して、本番 D1 にマイグレーションを適用します。



#### マイグレーション後の検証

```bash
./scripts/validate-migration.sh production
```

### 3. デプロイ後の確認

1. **CIデプロイ結果の確認**: `main` へのマージ後、CIが実行した `pnpm run deploy` の成否を確認します。
2. **本番マイグレーション**: CIではマイグレーションを走らせないため、ローカルから `pnpm run migrate:prod:remote` を実行して本番 D1 を更新します。
3. **検証**: `./scripts/validate-migration.sh production` などを使って整合性を確認し、必要に応じてアプリのヘルスチェックを行います。

> **補足**: CIによる自動デプロイではマイグレーションを実行しません。マイグレーションが必要な変更は、CIデプロイ後にローカルから `pnpm run deploy`→`pnpm run migrate:prod:remote` を実行して本番反映を完了させてください。

## Drizzleのマイグレーション

### マイグレーション手順

- 開発環境でのマイグレーションは `pnpm run migrate:dev:local`（package.json 定義）を使用します。詳細は開発ドキュメントを参照してください。
- 本番 D1 への適用は `pnpm run migrate:prod:remote` が基本です。
