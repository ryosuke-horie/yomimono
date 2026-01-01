/**
 * Cloudflare Workers上でMCPサーバーをホストするためのエントリーポイント
 * 現在はヘルスチェックエンドポイントのみを提供
 * TODO: SSE (Server-Sent Events) トランスポート対応を追加予定
 */

import { Hono } from "hono";

// 環境変数の型定義
type Env = {
	API_BASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

// ヘルスチェック用エンドポイント
app.get("/", (c) => {
	return c.json({
		service: "Yomimono MCP Server",
		version: "0.7.0",
		status: "healthy",
		note: "SSE transport support is planned for future implementation",
	});
});

export default app;
