# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
「effective-yomimono」は、技術記事を効率的に管理するためのツールです。Chrome拡張機能でブックマークを収集し、APIを通じてデータを保存、フロントエンドで整理・閲覧できます。

## プロジェクト構成
- **API**: Hono + Node.js + Cloudflare Workers (SQLite/D1)
- **フロントエンド**: Next.js + TailwindCSS + Cloudflare Workers
- **拡張機能**: Chrome Extension

## プロジェクトワークフロー
1. ユーザーは気になった技術記事をタブに一気に開く
2. 拡張機能を使って開いているタブのリンクとタイトルを収集しAPIを通じてDBに保存
3. ユーザーはフロントエンドにアクセスして未読記事を一覧し、気になったものから読む
4. 特に気になった記事はお気に入りに保存し、後から見直すことができる

## ディレクトリ構造
```
.
├── .clinerules ... AIアシスタント用のシステムプロンプト
├── .github ... CICD, Dependabot関連
├── api ... APIのソースコード (Hono/Node.js)
├── docs ... 設計や調査結果等のドキュメント
├── extension ... Chrome拡張機能のソースコード
└── frontend ... フロントエンドのソースコード (Next.js)
```

## ビルドコマンド
- API: `cd api && npm run dev` - APIの開発サーバーを起動
- フロントエンド: `cd frontend && npm run dev` - フロントエンドの開発サーバーを起動
- ビルド: `cd frontend && npm run build` - フロントエンドを本番用にビルド
- リント: `npm run lint` - それぞれのディレクトリでリンターを実行
- フォーマット: `npm run format` - それぞれのディレクトリでコードをフォーマット
- テスト: `cd api && npm run test` - すべてのテストを実行
- 単一テスト: `cd api && npx vitest run tests/unit/path/to/test.ts` - 特定のテストを実行
- テストカバレッジ: `cd api && npm test -- --coverage` - カバレッジレポート生成（9割以上必要）
- DB開発: `cd api && npm run migrate:development` - 開発環境用DBマイグレーション
- DB本番: `cd api && npm run migrate:production` - 本番環境用DBマイグレーション
- DB新規作成: `cd api && npx drizzle-kit generate` - マイグレーションファイル生成

## アーキテクチャ情報
- **API**: レイヤードアーキテクチャ採用
  - routes層: ルーティング
  - services層: ビジネスロジック
  - repositories層: DB操作
- **フロントエンド**: 機能ベースのディレクトリ構成
  - app: ページレイアウト
  - features: 機能ごとのコンポーネント・ロジック・型定義
  - components: 共通コンポーネント

## コードスタイル
- **フォーマット**: Biomeを使用（タブ、ダブルクォート）
- **インポート**: organize-importsを使用（Biomeで有効化）
- **型**: TypeScriptの厳格な型付けを使用（strict mode）
- **命名規則**: 変数/関数はcamelCase、コンポーネント/クラスはPascalCase
- **コミットメッセージ**: 絵文字プレフィックス + 日本語の説明（.github/copilot-instructions.mdを参照）
- **エラー処理**: try/catchブロックで明示的にエラーを処理
- **テスト記述**: テスト内容は日本語で記述し、理解しやすくする

## 依存関係管理
- **Dependabot**: `.github/dependabot.yml`で設定
  - 各ディレクトリごと（api, frontend, extension, mcp）に個別に依存関係を管理
  - 依存パッケージはグループ化されており、関連パッケージは一括で更新される
  - テスト関連パッケージ（vitest, @vitest/*）は同時に更新する必要があるためグループ化

## 言語設定
- 日本語での解答生成を優先する
- コードコメントは日本語で書く

## PR作成時
- .github/pull_request_template.mdのコメントを付与する。
- GitHub copilotによる自動レビューが有効なため、日本語でレビューさせる。