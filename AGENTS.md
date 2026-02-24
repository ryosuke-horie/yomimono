# Repository Guidelines

## プロジェクト構成と配置
- ルート配下: `api`(Cloudflare Workers/Hono), `frontend`(Next.js), `extension`(Chrome拡張), `mcp`(MCPユーティリティ), `docs`(設計/ADR)。
- テスト: APIは`api/tests`(Vitest)、フロントは`frontend/src`での単体テスト(Vitest)。
- アセット: `frontend/public`、拡張の画像は`extension/images`。

## 開発・ビルド・テスト
- 依存関係: 各ディレクトリで `pnpm install`（`only-allow`でpnpm固定）。
- API: `cd api && pnpm run dev`（Wranglerローカル）/ `pnpm run deploy`。
- フロント: `cd frontend && pnpm run dev|build|start`、プレビュー`pnpm run preview`。
- Lint/Format: 各パッケージ個別に `pnpm run lint|format`（Biome使用）。
- テスト: API `cd api && pnpm run test`、FE 単体 `cd frontend && pnpm run test`。

## コーディング規約・命名
- フォーマッタ: Biome（タブインデント、ダブルクォート、import整列）。
- 言語: TypeScript（API/FE/MCP）、拡張はJS中心。
- 命名: 変数/関数camelCase、ReactコンポーネントPascalCase、ファイル`kebab-case.ts[x]`。
- TSDocコメントを先頭に、可能なら実装と同一ファイルにVitest（`import.meta.vitest`）でTDDを推奨。

## テスト方針
- フレームワーク: Vitest（API/FE）。
- カバレッジ: APIはlines 76%/funcs・branches 80%、FEはglobal 80%（各`vitest.config.ts`参照）。
- 実行例: `cd frontend && pnpm run test:coverage`、`cd api && pnpm run test`。

## コミット／PR
- メッセージ: 絵文字＋日本語の要約（例: `🐛 fix: null IDを正しく扱う`）。`closes #123`等でIssue紐付け。ブランチは`issue-123`。
- PR: 目的/変更範囲/動作確認手順/スクリーンショット（UI）を記載。Lefthookフックパス、lint/format済みが必須。

## セキュリティ・設定
- `.env`はコミットしない。各ディレクトリの`.env.example`を複製し使用。Wrangler/DB操作はdevとprodを明確に区別。
- マイグレーションは`api`のdrizzle-kitスクリプトを利用。CIでの自動実行は避ける。

## 言語・コミュニケーション
- 原則、日本語で記述・説明・レビューを行う（コードコメント/テスト説明含む）。
- 例外が必要な場合でも、要約は日本語を添付してください。
