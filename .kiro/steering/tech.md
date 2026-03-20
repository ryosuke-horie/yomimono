# Technology Context

## スタック

| レイヤー | 技術 |
|---------|------|
| API | Hono on Cloudflare Workers |
| DB | Cloudflare D1 (SQLite) + Drizzle ORM |
| フロントエンド | Next.js 16 + React 19 + TailwindCSS 4 |
| フロントエンドホスティング | OpenNext + Cloudflare Workers |
| 拡張機能 | Chrome Extension Manifest v3 |
| パッケージマネージャ | pnpm 10 (モノレポ構成) |

## 型安全パイプライン

API の Hono ルート定義から OpenAPI スペックを自動生成し、
フロントエンドでは Orval がそのスペックから型安全な API クライアントを生成する。
pre-push フックで API-Frontend 間の同期を検証する。

## コード品質

- フォーマッタ/リンター: Biome (タブインデント、ダブルクォート)
- テスト: Vitest（in-source testing パターン）
- 未使用コード検出: knip
- Git フック: Lefthook (pre-commit: lint, pre-push: test/typecheck/knip/build/sync)
- TypeScript strict mode

## テスト方針

- TDD を採用。コードと同一ファイルに `import.meta.vitest` でテストを記述
- API: カバレッジ 76% lines/statements, 80% functions/branches
- Frontend: カバレッジ 80% global
- フロントエンドは jsdom + MSW でテスト

## 規約

- 命名: camelCase (変数/関数), PascalCase (コンポーネント/クラス)
- コメント: 日本語
- コミットメッセージ: `<type>: <説明>` 形式、日本語、絵文字禁止
- ファイル冒頭にコメントで仕様を記述する

## デプロイ

- API: `cd api && pnpm run deploy` (Cloudflare Workers)
- Frontend: `cd frontend && pnpm run deploy` (Cloudflare Workers)
- Extension: Chrome Web Store へ手動提出
- DB マイグレーション: Drizzle Kit で生成、`pnpm run migrate:production` で適用
