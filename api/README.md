APIのデプロイは手動で行う

```
npm install
npm run dev
```

```
npm run deploy
```

# drizzleのマイグレーション

マイグレーションファイル生成
`npx drizzle-kit generate`

マイグレーション適用

開発用(wranglerを利用してローカルにマイグレーション)
`npm run migrate:development`

本番用(drizzleを利用して本番にマイグレーション)
`npm run migrate:production`

本番DBのデータのコピーを取得する
`npx wrangler d1 export yomimono-db --remote --output=./data.sql --no-schema`

本番DBのデータコピーをローカルに流す
`data.sql`で`__drizzle_migrations`の記述を削除する。
`npx wrangler d1 execute yomimono-db --local --file=data.sql`
