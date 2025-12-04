# yomimono

効率的な読書管理のためのブックマーク収集・管理システムです。技術記事を収集し、読む習慣を効率化することを目的としています。

## プロジェクト概要
「yomimono」は、ウェブ上の読みたい記事やコンテンツを効率的に管理するためのツールです。技術記事をタブで開いて並べておくことが多い開発者の習慣に着目し、Chrome拡張機能でブックマークを簡単に収集し、APIを通じてデータを保存、フロントエンドで整理・閲覧できます。

## セットアップと実行方法

### 前提
- 依存関係のインストールやスクリプト実行は、各パッケージディレクトリに移動して `pnpm` を利用してください。
- ルートには `.env` を配置し、必要に応じて各パッケージの `.env.example` をコピーして利用します。

## BFF共通部品の使い方
- サーバー専用クライアント: `frontend/src/lib/bff/client.ts` の `fetchFromApi` に Orvalサーバー生成物のURLビルダー（例: `getGetApiBookmarksUrl`）を渡す。`revalidateSeconds` で `next.revalidate`、デフォルトは `cache: "no-store"`。
- エラー正規化: `frontend/src/lib/bff/errors.ts` の `normalizeUpstreamError` と `errorJsonResponse` で `{ success: false, message, code }` に統一。
- 環境変数: 外部APIのURL/キーは `BFF_API_BASE_URL`/`BFF_API_KEY`（サーバー専用）に置き、`NEXT_PUBLIC_*` には機密情報を入れない。
- キャッシュ方針: `buildCacheControl` で `maxAge`/`staleWhileRevalidate` を付与してレスポンスヘッダーを一元管理。

### API
```bash
cd api
pnpm install
pnpm run dev  # 開発サーバー起動
```

### フロントエンド
```bash
cd frontend
pnpm install
pnpm run dev  # 開発サーバー起動（http://localhost:3000）
pnpm run knip # 未使用依存/ファイル検出
```

### Chrome拡張機能
```bash
cd extension
pnpm install
pnpm run build  # dist配下にパッケージング
```

Chromeへの読み込み手順:
1. Chromeブラウザで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `extension/dist` ディレクトリを選択（開発中は `extension` 直下でも可）

### デプロイ
```bash
# API
cd api
pnpm run deploy

# フロントエンド
cd frontend
pnpm run deploy
```

## 開発ツール

### Lint / Format
各ディレクトリで Biome を実行します。
```bash
cd api && pnpm run lint
cd api && pnpm run format

cd frontend && pnpm run lint
cd frontend && pnpm run format

cd extension && pnpm run lint
cd extension && pnpm run format

cd mcp && pnpm run lint
cd mcp && pnpm run format
```

### テスト
```bash
# API
cd api
pnpm run test  # Vitestはwatch無効化済みで単発実行

# フロントエンド
cd frontend
pnpm run test
```

Vitestは設定でwatchモードを無効化しているため、`pnpm run test`は常にワンショットで完了します。

## データベースマイグレーション
```bash
cd api
# マイグレーションファイル生成
pnpm run db:generate

# マイグレーション適用
pnpm run migrate:development
```
