# Yomimono MCP Server

## 概要

ラベリング用MCPサーバーが公開しているツールは以下の通りです。

### ラベル管理ツール
- `getUnlabeledArticles`: 未ラベルのブックマークを取得（引数なし）
- `getLabels`: 既存ラベル一覧を取得（引数なし）
- `assignLabel`: 指定ブックマークにラベルを1件付与（引数: `articleId`, `labelName`, `description?`）
- `assignLabelsToMultipleArticles`: 複数ブックマークへラベルを一括付与（引数: `articleIds`, `labelName`, `description?`）
- `getLabelById`: ラベルIDを指定して詳細を取得（引数: `labelId`）

### ブックマーク管理ツール
- `getUnreadBookmarks`: 未読ブックマーク一覧を取得（引数なし）

## 利用方法

### 前提
- パッケージ管理は`pnpm`のみサポート（`npx only-allow pnpm`を利用）。
- `API_BASE_URL` 環境変数にバックエンドAPIのベースURLを設定してください。

### Remote MCPサーバー（Cloudflare Workers）

MCPサーバーをCloudflare Workers上でホストし、HTTP/SSE経由でリモートアクセスできます。

#### デプロイ
1. 依存関係をインストールします。
    ```bash
    cd mcp
    pnpm install
    ```
2. Cloudflare Workersにデプロイします。
    ```bash
    # ステージング環境
    pnpm run deploy:staging

    # 本番環境
    pnpm run deploy:production
    ```
3. 環境変数を設定します（デプロイ後）。
    ```bash
    # API_BASE_URLをシークレットとして設定
    wrangler secret put API_BASE_URL --env production
    # プロンプトが表示されたら、APIのベースURLを入力
    ```

#### Claude Desktop連携（リモートサーバー）
Claude Desktopからリモートサーバーに接続する場合、設定ファイルに以下を追加します。

```json
"yomimono-mcp-remote": {
  "url": "https://yomimono-mcp-production.your-subdomain.workers.dev/sse",
  "transport": "sse"
}
```

### ローカル開発（MCP Inspector等）
1. 依存関係をインストールします。
    ```bash
    cd mcp
    pnpm install
    ```
2. TypeScriptをビルドします。
    ```bash
    pnpm run build
    ```
3. ビルド済みサーバーを起動し、標準入出力で待ち受けます。
    ```bash
    node build/index.js
    ```
4. [MCP Inspector](https://github.com/modelcontextprotocol/inspector) などのクライアントから接続し、必要なツール（例: `assignLabelsToMultipleArticles`）を呼び出します。

### Claude Desktop 連携
Claude Desktopで利用する場合は設定ファイル（macOS例: `~/Library/Application Support/Claude/claude_desktop_config.json`）に以下のエントリを追加します。

```json
"yomimono-mcp": {
  "command": "node",
  "args": ["/絶対パス/yomimono/mcp/build/index.js"],
  "env": {
    "API_BASE_URL": "https://effective-yomimono-api.ryosuke-horie37.workers.dev"
  },
  "disabled": false,
  "autoApprove": []
}
```

- `/絶対パス/yomimono` はローカルの実パスに置き換えてください。
- `API_BASE_URL` は利用したい環境（ローカル/ステージング/本番）に合わせて変更します。
- 設定後にClaude Desktopを再起動するとサーバーが利用可能になります。

## 開発タスク

- ビルド: `pnpm run build`
- Lint: `pnpm run lint`
- フォーマット: `pnpm run format`
- 未使用コード検出: `pnpm run knip`
- 型チェック: `pnpm run typecheck`
- テスト: `pnpm run test`（watchモードは無効化されているため、毎回ワンショット実行されます）

必要に応じて `pnpm run build -- --watch` を使用するとTypeScriptの再ビルドを監視できます。

### Knipによる未使用コード検出

- `pnpm run knip` で未使用の依存関係・ファイル・エクスポートを検出します。
- MCPサーバーのエントリ（`src/index.ts`）とソース一式（`src/**/*.ts`）を解析対象にし、ビルド成果物（`build/**`）や `only-allow` バイナリは除外しています。設定は `knip.json` を参照してください。
