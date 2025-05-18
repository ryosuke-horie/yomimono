import { Hono } from "hono";
import type { RssFeedService } from "../services/rssFeed";

export const createRssFeedsRouter = (rssFeedService: RssFeedService) => {
	const app = new Hono();
	// RSSフィード一覧取得
	app.get("/feeds", async (c) => {
		const feeds = await rssFeedService.getAllFeeds();
		return c.json({
			feeds,
			total: feeds.length,
		});
	});

	// RSSフィード詳細取得
	app.get("/feeds/:id", async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		const feed = await rssFeedService.getFeedById(id);

		// TODO: 統計情報を実装する場合は、ここで集計する
		const stats = {
			totalItems: 0,
			todayItems: 0,
			lastWeekItems: 0,
		};

		return c.json({
			...feed,
			stats,
		});
	});

	// RSSフィード作成
	app.post("/feeds", async (c) => {
		const data = await c.req.json();
		const newFeed = await rssFeedService.createFeed(data);
		return c.json(newFeed, 201);
	});

	// RSSフィード更新
	app.put("/feeds/:id", async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		const data = await c.req.json();
		const updatedFeed = await rssFeedService.updateFeed(id, data);
		return c.json(updatedFeed);
	});

	// RSSフィード削除
	app.delete("/feeds/:id", async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		// TODO: クエリパラメータでdeleteBookmarksを確認し、関連ブックマークも削除する処理を追加
		await rssFeedService.deleteFeed(id);
		return c.body(null, 204);
	});

	return app;
};