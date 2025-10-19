# Effective Yomimono MCP Server

## 概要

このサーバーは以下のツールを公開します：

### ラベル管理ツール
- **`getUnlabeledArticles`**: ラベル付けされていない記事をAPIから取得します。（引数なし）
- **`getLabels`**: 既存のラベル一覧をAPIから取得します。（引数なし）
- **`assignLabel`**: 指定された記事IDに指定されたラベル名をAPI経由で割り当てます。（引数: `articleId`, `labelName`, `description`）
- **`getLabelById`**: 特定のラベルを取得します。（引数: `labelId`）
- **`deleteLabel`**: ラベルを削除します。（引数: `labelId`）
- **`updateLabelDescription`**: ラベルの説明を更新します。（引数: `labelId`, `description`）
- **`assignLabelsToMultipleArticles`**: 複数の記事に一括でラベルを付与します。（引数: `articleIds`, `labelName`, `description`）

### ブックマーク管理ツール
- **`getUnreadBookmarks`**: 未読ブックマークを取得します。（引数なし）
- **`markBookmarkAsRead`**: 指定ブックマークを既読にします。（引数: `bookmarkId`）

## Connecting with a Client

### ローカル開発 / MCP Inspector
[MCP Inspector](https://github.com/modelcontextprotocol/inspector) のようなMCPクライアントを使用して、ローカルで実行中のサーバー（`npm run src/index.ts` で起動）に接続し、`autoLabelArticles` ツールと対話できます。

### Claude Desktop 連携
このサーバーをClaude Desktopと連携させるには：

1.  **サーバーのビルド**: TypeScriptコードをJavaScriptにコンパイルします。
    ```bash
    cd mcp
    npm run build
    ```
    これにより、コンパイルされたコード（例：`build/index.js`）を含む `build` ディレクトリが作成されます。

2.  **Claude Desktopの設定**: Claude Desktopの設定ファイル（通常、macOSでは `~/Library/Application Support/Claude/claude_desktop_config.json` にあります）を編集します。`mcpServers` オブジェクト内に以下のエントリを追加します。

    ```json
    "effective-yomimono-mcp": {
      "command": "node",
      "args": ["/プロジェクトへの絶対パス/effective-yomimono/mcp/build/index.js"],
      "env": {
        "API_BASE_URL": "https://effective-yomimono-api.ryosuke-horie37.workers.dev"
      },
      "disabled": false,
      "autoApprove": []
    }
    ```
    - `/プロジェクトへの絶対パス/effective-yomimono` を実際のプロジェクトディレクトリへの絶対パスに置き換えてください。
    - `API_BASE_URL` がデプロイ済みのバックエンドAPIエンドポイントと一致していることを確認してください。

3.  **Claude Desktopの再起動**: 変更を有効にするためにClaude Desktopを再起動します。サーバーがClaude内で利用可能になるはずです。

## 開発

- **ビルド**: `npm run build` （TypeScriptを `build/` ディレクトリ内のJavaScriptにコンパイルします）
- **Lint/フォーマット**: Biomeを使用。`npm run biome check .` または `npm run biome format --write .` を実行。
