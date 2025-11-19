import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { registerTools } from "./tools.js";

// dotenvを使って環境変数を読み込む（quiet指定で標準出力を汚さない）
dotenv.config({ quiet: true });

// MCPサーバーインスタンスを生成
export const server = new McpServer({
	name: "YomimonoLabeler", // サーバー識別用の名前
	version: "0.7.0", // レーティング機能削除後のバージョン
});

// ツールをまとめて登録
registerTools(server);

async function main() {
	// 初期開発ではStdioトランスポートを利用
	const transport = new StdioServerTransport();

	try {
		// サーバーをトランスポートに接続
		await server.connect(transport);
	} catch (error) {
		// 実際のエラーは標準エラー出力に流す
		console.error("Failed to connect MCP server:", error);
		process.exit(1); // 接続に失敗した場合は終了
	}
}

if (!process.env.VITEST) {
	void main();
}
