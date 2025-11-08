# APIのデプロイ手順

> **pnpm必須**: `only-allow`でpnpm以外のパッケージマネージャーを拒否しています。以下のコマンドはすべて`pnpm`を前提にしています。

## 開発環境と本番環境の分離

このプロジェクトでは、開発環境と本番環境のデータベース接続を明確に分離しています。

- **開発環境（`pnpm run dev`）**: Miniflareの提供するローカルDBを使用します
- **本番環境（`pnpm run deploy`）**: Cloudflare D1の本番データベースを使用します

これにより、開発時に誤って本番データベースを変更してしまうことを防止します。

## 開発環境

```bash
pnpm install
pnpm run dev
```

better-sqlite3やesbuildなどネイティブ依存を含むため、`pnpm.onlyBuiltDependencies`の設定により`pnpm install`時に自動ビルドされます。環境差分でバイナリが壊れた場合は`pnpm rebuild`を実行して再生成してください。

> MiniflareのローカルD1（`.wrangler/state/v3/d1`）をSeed/起動に共用します。初回は `pnpm run migrate:dev:local` を実行してテーブルを作成しておいてください。

## package.json スクリプト一覧

### 開発・ビルド

| コマンド | 説明 | 備考 |
| --- | --- | --- |
| `pnpm run dev` | `wrangler dev --env development --local`を介してCloudflare Workersをローカル実行します | Port 8787/Miniflare、`NODE_ENV=development` |
| `pnpm run deploy` | `wrangler deploy --minify`で本番デプロイを実行します | `NODE_ENV=production`/Cloudflareの既定環境を対象 |

### テスト・品質

| コマンド | 説明 | 備考 |
| --- | --- | --- |
| `pnpm run lint` | Biomeで静的解析を行います | 変更は加えません |
| `pnpm run format` | Biomeでフォーマットを適用します | 自動修正が発生するためコミット前に実行 |
| `pnpm run test` | Vitestの単発実行 | `import.meta.vitest`のケースも含む |
| `pnpm run knip` | 未使用コード検出 | 依存掃除のトリアージに使用 |

### マイグレーションとDBユーティリティ

| コマンド | 説明 | 備考 |
| --- | --- | --- |
| `pnpm run migrate:dev:local` | Wrangler D1で`yomimono-db-dev`ローカルに適用 | Miniflare上のローカルDB |
| `pnpm run migrate:prod:remote` | CloudflareリモートD1へ適用 | `wrangler d1 migrations apply yomimono-db --remote` |
| `pnpm run db:generate` | Drizzleスキーマからマイグレーションを生成 | `drizzle-kit generate` |

### シードスクリプト

| コマンド | 説明 | 備考 |
| --- | --- | --- |
| `pnpm run seed` | ローカルD1をクリアした上で初期データを投入 | `NODE_ENV=development`、コマンド内でクリア→投入を実施 |

各コマンドは共通の`src/scripts/seed-runner.ts`を使用しており、`SEED_OPTIONS='{"bookmarkCount":10}'`のようにJSON文字列を渡すことで任意値を上書きできます。`pnpm run seed`は内部でクリア→投入を実行します。MiniflareのD1ファイルを直接操作するため、複数DBが存在する場合は `D1_SQLITE_PATH=/absolute/path/to.sqlite pnpm run seed` のようにファイルパスを明示してください。データクリアのみ実施したい場合は `NODE_ENV=development SEED_PRESET=clear pnpm exec tsx src/scripts/seed-runner.ts` を直接叩いてください。

## テスト実行

Vitestはwatchモードを無効化しており、常に単発での実行になります。

```bash
pnpm install
pnpm run test
```

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
`pnpm run migrate:development`

本番用(drizzleを利用して本番にマイグレーション)
`pnpm run migrate:production`

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
