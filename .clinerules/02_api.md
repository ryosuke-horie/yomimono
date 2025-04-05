# API

## clinerule

- APIに関連する対応を行う前に、必ずこのファイルのディレクトリ構成を参考にプロジェクト構造を把握すること。

## ディレクトリ構成

```
.
├── biome.json ... BiomeによるLintルール設定
├── drizzle ... drizzleによって出力するSQLファイルを配置
├── drizzle.config.ts ... drizzle設定ファイル
├── knip.config.ts ... knip設定ファイル
├── README.md
├── src ... Honoを採用
│   ├── db ... DB(SQLint=D1用のスキーマ定義)
│   ├── index.ts (エントリーポイント)
│   ├── repositories ... DB操作を集約するRepository層
│   ├── routes ... ルーティングを定義
│   └── services ... ロジックを記述するService層
├── tests ... 単体テストをVitestで記述
│   └── unit ... srcのディレクトリ構成に沿って記載
│       ├── repositories
│       ├── routes
│       └── services
└── wrangler.jsonc ... wrangler設定ファイル(deploy用)
```

## ランタイム

Bunを採用。

## 静的解析

`knip`, `Biome`を採用。
CIでPull Requestに対して検証されるため、必ずパスする必要がある。

## テスト

- Vitestによる単体テストのみ記載する。
- `npm test -- --coverage`を実行して9割以上を網羅する必要がある。(静的解析で検証する)
- テスト内容を理解しやすいように日本語でテストケースを記述する

## DB

- Cloudflare D1を採用（SQLite）
- DrizzleをORMとして採用している