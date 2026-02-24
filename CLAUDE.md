# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
「yomimono」は、技術記事を効率的に管理するためのツールです。Chrome拡張機能でブックマークを収集し、APIを通じてデータを保存、フロントエンドで整理・閲覧できます。

## 重要

### コード品質チェックについて

Lefthook による Git フックでコード品質を担保しています。
必ず編集したディレクトリの Lint, TypeCheck, Test を実行するようにしましょう。
`--no-verify` 等でフックをスキップすることは認めません。

#### Lefthook 設計方針

pre-commit（コミット時）:
- 変更パッケージの lint を実行

pre-push（プッシュ時）:
- 変更パッケージの test / typecheck / knip / build 等を実行
- API・フロントエンド間の OpenAPI / orval 同期チェックを実行

変更があったパッケージのみチェック対象となるため、無関係なパッケージの待ち時間は発生しません。

### テスト駆動開発を行う
TDDを実施する。コードを生成するときにはそれに対応するユニットテストを常に生成する。
コードを追加で修正したときには`pnpm run test`がパスすることを常に確認する。

```ts
function add(a: number, b: number) { return a + b }
test("1+2=3", () => {
  expect(add(1, 2)).toBe(3);
});
```

### vitest で実装と同じファイルにユニットテストを書く。
出力例
```ts
export function distance(a: Point, b: Point): number {...}
if (import.meta.vitest) {
  const {test, expect} = import.meta.vitest;
  test("ユークリッド距離を計算する", () => {
    const result = distance({x: 0, y: 0}, {x: 3, y: 4});
    expect(distance(result)).toBe(5)
  });
}
```

### 各ファイルの冒頭にはコメントで仕様を記述する

出力例

```ts
/**
 * 2点間のユークリッド距離を計算する
**/
type Point = { x: number; y: number; };
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
```

## プロジェクト構成
- **API**: Hono + Node.js + Cloudflare Workers (SQLite/D1)
- **フロントエンド**: Next.js + TailwindCSS + Cloudflare Workers
- **拡張機能**: Chrome Extension

## プロジェクトワークフロー
1. ユーザーは気になった技術記事をタブに一気に開く
2. 拡張機能を使って開いているタブのリンクとタイトルを収集しAPIを通じてDBに保存
3. ユーザーはフロントエンドにアクセスして未読記事を一覧し、気になったものから読む
4. 特に気になった記事はお気に入りに保存し、後から見直すことができる

## プロジェクト管理

このプロジェクトは**Linear**を使用してプロジェクト管理を行っています。

- **ワークスペース**: edge-work
- **プロジェクト**: 読み物保守
- **ラベル**: 読み物

### ブランチ命名規則

作業を開始する際は、LinearのイシューID（例: `EDG-289`）をそのままブランチ名として使用します。

```bash
git checkout -b EDG-289
```

### MCP連携

Linear MCPツールが利用可能な環境では、Claude Codeから直接Linearの操作（イシュー作成・検索・更新等）が可能です。

詳細なルールは `.claude/rules/linear.md` を参照してください。

## ディレクトリ構造
```
.
├── .claude ... Claude Code用のルールファイル
├── .github ... Dependabot関連
├── api ... APIのソースコード (Hono/Node.js)
├── docs ... 設計や調査結果等のドキュメント
├── extension ... Chrome拡張機能のソースコード
└── frontend ... フロントエンドのソースコード (Next.js)
```

## よく利用するコマンド
- API開発: `cd api && pnpm run dev` - APIの開発サーバーを起動
- フロント開発: `cd frontend && pnpm run dev` - フロントエンドの開発サーバーを起動
- フロントビルド: `cd frontend && pnpm run build` - フロントエンドを本番用にビルド
- リント/フォーマット: `cd <package> && pnpm run lint|format` - 各ディレクトリで実行（`<package>` は `api` / `frontend` / `extension` を指定）
- テスト: `cd api && pnpm run test` / `cd frontend && pnpm run test` - 各パッケージのテストを実行
- 単一テスト: `cd api && pnpm vitest run tests/unit/path/to/test.ts` - 特定のテストを実行
- テストカバレッジ: `cd api && pnpm run test -- --coverage` - カバレッジレポート生成（9割以上必要）
- DB開発: `cd api && pnpm run migrate:development` - 開発環境用DBマイグレーション
- DB本番: `cd api && pnpm run migrate:production` - 本番環境用DBマイグレーション
- DB新規作成: `cd api && pnpm run db:generate` - マイグレーションファイル生成
- APIデプロイ: `cd api && pnpm run deploy` - APIをCloudflare Workersにデプロイ
- フロントデプロイ: `cd frontend && pnpm run deploy` - フロントエンドをCloudflareにデプロイ

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
- **コミットメッセージ**:
  - **絵文字の使用禁止**: コミットメッセージに絵文字を使用しないこと
  - プレフィックス形式: `<type>: <description>` (例: `feat: ユーザー認証機能を追加`, `fix: ログイン時のバグを修正`)
  - 日本語で簡潔に記述する
  - type一覧: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **エラー処理**: try/catchブロックで明示的にエラーを処理
- **テスト記述**: テスト内容は日本語で記述し、理解しやすくする

## 依存関係管理
- **Dependabot**: `.github/dependabot.yml`で設定
  - 各ディレクトリごと（ルート, api, frontend, extension）に個別に依存関係を管理
  - 依存パッケージはグループ化されており、関連パッケージは一括で更新される
  - テスト関連パッケージ（vitest, @vitest/*）は同時に更新する必要があるためグループ化

## 言語設定
- 日本語での解答生成を優先する
- コードコメントは日本語で書く

## ユーザーへの質問
- 不明点や確認事項がある場合は、必ずAskUserQuestionツールを使用して質問する
- 勝手に推測して進めず、ユーザーの意図を確認してから作業を行う

## PR作成時
- .github/pull_request_template.mdのコメントを付与する。
- GitHub copilotによる自動レビューが有効なため、日本語でレビューさせる。
