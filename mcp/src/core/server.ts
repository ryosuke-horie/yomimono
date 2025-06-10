/**
 * MCPサーバーのメインファイル
 * 各機能のツールを統合し、MCPサーバーを起動する
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { registerBookmarkTools } from "../features/bookmark/tools/index.js";
import { registerLabelTools } from "../features/label/tools/index.js";
import { registerContentRatingTool } from "../features/rating/tools/contentRatingTool.js";
import { registerRatingTools } from "../features/rating/tools/index.js";

// 環境変数を読み込み
dotenv.config();

/**
 * MCPサーバーを初期化して起動する
 */
export async function startServer() {
	// MCPサーバーインスタンスを作成
	const server = new McpServer({
		name: "EffectiveYomimonoLabeler",
		version: "0.6.0", // Phase 2: Advanced MCP rating tools with filtering, stats, and bulk operations
	});

	// 各機能のツールを登録
	registerLabelTools(server);
	registerBookmarkTools(server);
	registerRatingTools(server);
	registerContentRatingTool(server);

	// StdioServerTransportを使用してサーバーを起動
	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error("MCP server 'EffectiveYomimonoLabeler' started successfully");
}
