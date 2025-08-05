# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
「effective-yomimono」は、技術記事を効率的に管理するためのツールです。Chrome拡張機能でブックマークを収集し、APIを通じてデータを保存、フロントエンドで整理・閲覧できます。

## 重要

### GitHub Actions制限について

**⚠️ 重要**: GitHub Actions無料枠制限により、E2Eテストを含むGitHub-hosted runnerワークフローを一時的に無効化しています。

- 無効化されたファイル: `.github/workflows/disabled/ci-github-hosted.yml.disabled`
- E2Eテストは手動での動作確認に切り替え
- 無料枠復活時は `.github/workflows/disabled/README.md` の手順で再有効化
- **このセクションは無効化解除時に削除してください**

### CIについて

CIがパスしない限りマージすることは許容できません。
必ず編集したディレクトリのLint, TypeCheck, Testを実行するようにしましょう。
またコメント等を利用してDisableすることも認めません。本気で取り組みましょう

#### CI設計方針
**現在**: セルフホストランナーのみ稼働（GitHub Actions制限のため）

**セルフホストランナー（軽量・高速）：**
- リント・単体テスト・型チェック・セキュリティ監査
- 事前セットアップ環境でキャッシュ効果を活用

**GitHub-hosted Runner（一時停止中）：**
- E2Eテスト・ビルドテスト
- GitHub Actions無料枠制限により停止中

#### E2Eテスト方針（一時停止中）
- **状況**: GitHub Actions制限により手動実行に切り替え
- **対象ブラウザ**: Chromeのみ（シンプル化）
- **テスト範囲**: 正常系の最低限保証のみ
  - 未読一覧画面の表示
  - 既読処理と表示内容変更の確認
  - ラベルフィルタリング機能
- **手動実行**: `cd frontend && pnpm run test:e2e`
- **その他の品質保証**: エラーハンドリング・パフォーマンス・レンダリング等は単体テスト側で担保

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

## よく利用するコマンド
- API: `cd api && pnpm run dev` - APIの開発サーバーを起動
- フロントエンド: `cd frontend && pnpm run dev` - フロントエンドの開発サーバーを起動
- ビルド: `cd frontend && pnpm run build` - フロントエンドを本番用にビルド
- リント: `pnpm run lint` - それぞれのディレクトリでリンターを実行
- フォーマット: `pnpm run format` - それぞれのディレクトリでコードをフォーマット
- 型チェック: `pnpm run typecheck` - それぞれのディレクトリでTypeScriptの型チェックを実行
- テスト: `cd api && pnpm run test` - すべてのテストを実行
- 単一テスト: `cd api && pnpm vitest run tests/unit/path/to/test.ts` - 特定のテストを実行
- テストカバレッジ: `cd api && pnpm test -- --coverage` - カバレッジレポート生成（9割以上必要）
- DB開発: `cd api && pnpm run migrate:development` - 開発環境用DBマイグレーション
- DB本番: `cd api && pnpm run migrate:production` - 本番環境用DBマイグレーション
- DB新規作成: `cd api && pnpm drizzle-kit generate` - マイグレーションファイル生成

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