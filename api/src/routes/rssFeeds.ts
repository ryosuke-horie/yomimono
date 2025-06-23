import { Hono } from "hono";
import {
	createErrorResponse,
	createErrorResponseBody,
	NotFoundError,
} from "../exceptions";
import type { RssFeedService } from "../services/rssFeed";

export const createRssFeedsRouter = (rssFeedService: RssFeedService) => {
	const app = new Hono();
	// RSSフィード一覧取得
	app.get("/feeds", async (c) => {
		try {
			const feeds = await rssFeedService.getAllFeeds();
			return c.json({
				feeds,
				total: feeds.length,
			});
		} catch (error) {
			console.error("Failed to get feeds:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// RSSフィード詳細取得
	app.get("/feeds/:id", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				throw new NotFoundError("Feed not found");
			}
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
		} catch (error) {
			console.error("Failed to get feed:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// RSSフィード作成
	app.post("/feeds", async (c) => {
		try {
			const data = await c.req.json();
			const newFeed = await rssFeedService.createFeed(data);
			return c.json(newFeed, 201);
		} catch (error) {
			console.error("Failed to create feed:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// RSSフィード更新
	app.put("/feeds/:id", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				throw new NotFoundError("Feed not found");
			}
			const data = await c.req.json();
			const updatedFeed = await rssFeedService.updateFeed(id, data);
			return c.json(updatedFeed);
		} catch (error) {
			console.error("Failed to update feed:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// RSSフィード削除
	app.delete("/feeds/:id", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				throw new NotFoundError("Feed not found");
			}
			// TODO: クエリパラメータでdeleteBookmarksを確認し、関連ブックマークも削除する処理を追加
			await rssFeedService.deleteFeed(id);
			return c.body(null, 204);
		} catch (error) {
			console.error("Failed to delete feed:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	return app;
};
