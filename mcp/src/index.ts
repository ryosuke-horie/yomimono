/**
 * MCPサーバーのエントリーポイント
 */

import { startServer } from "./core/server.js";

// サーバーを起動
startServer().catch((error) => {
	console.error("Failed to start MCP server:", error);
	process.exit(1);
});
