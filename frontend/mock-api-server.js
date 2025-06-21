#!/usr/bin/env node
/**
 * E2Eテスト用モックAPIサーバー (CI環境用)
 * 必要最小限のAPIエンドポイントを提供
 */

const http = require("node:http");
const { URL } = require("node:url");

const PORT = 8787;

// モックデータ
const mockBookmarks = [
	{
		id: 1,
		url: "https://example.com/article1",
		title: "Test Article 1",
		labels: ["テスト"],
		isRead: false,
		isFavorite: false,
		createdAt: "2025-06-21T00:00:00.000Z",
		readAt: null,
	},
	{
		id: 2,
		url: "https://example.com/article2",
		title: "Test Article 2",
		labels: [],
		isRead: true,
		isFavorite: true,
		createdAt: "2025-06-20T00:00:00.000Z",
		readAt: "2025-06-21T00:00:00.000Z",
	},
];

const mockLabels = [
	{ id: 1, name: "テスト", description: "テスト用ラベル" },
	{ id: 2, name: "React", description: "React関連記事" },
];

function handleRequest(req, res) {
	// CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, OPTIONS",
	);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		res.writeHead(200);
		res.end();
		return;
	}

	const url = new URL(req.url, `http://localhost:${PORT}`);
	const path = url.pathname;

	console.log(`${req.method} ${path}`);

	// Health check
	if (path === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
		);
		return;
	}

	// Get unread bookmarks (main bookmarks endpoint)
	if (path === "/api/bookmarks" && req.method === "GET") {
		const unreadBookmarks = mockBookmarks.filter((b) => !b.isRead);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				success: true,
				bookmarks: unreadBookmarks,
				totalUnread: unreadBookmarks.length,
				todayReadCount: mockBookmarks.filter((b) => b.isRead).length,
			}),
		);
		return;
	}

	// Get read bookmarks
	if (path === "/api/bookmarks/read" && req.method === "GET") {
		const readBookmarks = mockBookmarks.filter((b) => b.isRead);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: true, bookmarks: readBookmarks }));
		return;
	}

	// Get favorite bookmarks
	if (path === "/api/bookmarks/favorites" && req.method === "GET") {
		const favoriteBookmarks = mockBookmarks.filter((b) => b.isFavorite);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: true, bookmarks: favoriteBookmarks }));
		return;
	}

	// Get labels
	if (path === "/api/labels" && req.method === "GET") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: true, labels: mockLabels }));
		return;
	}

	// Mark bookmark as read (using PATCH like real API)
	if (path.match(/^\/api\/bookmarks\/\d+\/read$/) && req.method === "PATCH") {
		const bookmarkId = Number.parseInt(path.split("/")[3]);
		const bookmark = mockBookmarks.find((b) => b.id === bookmarkId);
		if (bookmark) {
			bookmark.isRead = true;
			bookmark.readAt = new Date().toISOString();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: true, bookmark }));
		} else {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: false, error: "Bookmark not found" }));
		}
		return;
	}

	// Add bookmark to favorites (using PATCH like real API)
	if (
		path.match(/^\/api\/bookmarks\/\d+\/favorite$/) &&
		req.method === "PATCH"
	) {
		const bookmarkId = Number.parseInt(path.split("/")[3]);
		const bookmark = mockBookmarks.find((b) => b.id === bookmarkId);
		if (bookmark) {
			bookmark.isFavorite = true;
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: true, bookmark }));
		} else {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ success: false, error: "Bookmark not found" }));
		}
		return;
	}

	// Default 404 response
	res.writeHead(404, { "Content-Type": "application/json" });
	res.end(
		JSON.stringify({
			success: false,
			error: "Not found",
			message: `Endpoint ${path} not implemented in mock server`,
		}),
	);
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
	console.log(`🔧 モックAPIサーバーが起動しました: http://localhost:${PORT}`);
	console.log("📋 利用可能エンドポイント:");
	console.log("   GET   /health - ヘルスチェック");
	console.log("   GET   /api/bookmarks - 未読ブックマーク一覧");
	console.log("   GET   /api/bookmarks/read - 既読ブックマーク一覧");
	console.log("   GET   /api/bookmarks/favorites - お気に入り一覧");
	console.log("   GET   /api/labels - ラベル一覧");
	console.log("   PATCH /api/bookmarks/:id/read - ブックマーク既読化");
	console.log("   PATCH /api/bookmarks/:id/favorite - お気に入り追加");
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("\n🛑 モックAPIサーバーを停止中...");
	server.close(() => {
		console.log("✅ モックAPIサーバーが停止しました");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	console.log("\n🛑 モックAPIサーバーを停止中...");
	server.close(() => {
		console.log("✅ モックAPIサーバーが停止しました");
		process.exit(0);
	});
});
