import type { Hono } from "hono";
import type { RssFeedService } from "../services/rssFeed";

interface Services {
	rssFeed: RssFeedService;
}

export default function rssFeedsRoute(
	app: Hono<{ Bindings: { DB: D1Database } }>,
	services: Services,
) {
	// RSSフィード一覧取得
	app.get("/api/rss/feeds", async (c) => {
		const feeds = await services.rssFeed.getAllFeeds();
		return c.json({
			feeds,
			total: feeds.length,
		});
	});

	// RSSフィード詳細取得
	app.get("/api/rss/feeds/:id", async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		const feed = await services.rssFeed.getFeedById(id);

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
	app.post("/api/rss/feeds", async (c) => {
		const data = await c.req.json();
		const newFeed = await services.rssFeed.createFeed(data);
		return c.json(newFeed, 201);
	});

	// RSSフィード更新
	app.put("/api/rss/feeds/:id", async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		const data = await c.req.json();
		const updatedFeed = await services.rssFeed.updateFeed(id, data);
		return c.json(updatedFeed);
	});

	// RSSフィード削除
	app.delete("/api/rss/feeds/:id", async (c) => {
		const id = Number.parseInt(c.req.param("id"));
		// TODO: クエリパラメータでdeleteBookmarksを確認し、関連ブックマークも削除する処理を追加
		await services.rssFeed.deleteFeed(id);
		return c.body(null, 204);
	});
}
