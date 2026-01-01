/**
 * MCPサーバーの共通設定と作成ロジック
 * StdioとSSEの両方のトランスポートで使用される
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools.js";

/**
 * MCPサーバーインスタンスを作成し、ツールを登録する
 * @returns 設定済みのMCPサーバーインスタンス
 */
export function createMcpServer(): McpServer {
	const server = new McpServer({
		name: "YomimonoLabeler",
		version: "0.7.0",
	});

	// ツールをまとめて登録
	registerTools(server);

	return server;
}
