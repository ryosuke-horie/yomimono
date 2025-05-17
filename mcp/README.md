# Effective Yomimono Labeler MCP Server

This directory contains the MCP (Model Context Protocol) server responsible for automatically labeling saved articles in the Effective Yomimono application. It interacts with the backend API to fetch unlabeled articles and assign labels based on predefined logic (currently placeholder, intended for LLM integration).

## 概要

このサーバーは以下の3つのツールを公開します：

- **`getUnlabeledArticles`**: ラベル付けされていない記事をAPIから取得します。（引数なし）
- **`getLabels`**: 既存のラベル一覧をAPIから取得します。（引数なし）
- **`assignLabel`**: 指定された記事IDに指定されたラベル名をAPI経由で割り当てます。（引数: `articleId`, `labelName`）

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
- **静的解析**: knipを使用。`npm run knip` を実行。
