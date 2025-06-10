/**
 * MCPサーバーのエントリーポイント
 */

import { startServer } from "./core/server.js";

// サーバーを起動
startServer().catch((error) => {
	console.error("Failed to start MCP server:", error);
	// Don't exit during testing
	if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
		process.exit(1);
	}
});
