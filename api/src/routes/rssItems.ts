import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { RssFeedItemService } from "../interfaces/service/rssFeedItem";

export const createRssItemsRouter = (
	rssFeedItemService: RssFeedItemService,
) => {
	const app = new Hono();

	// RSSフィードアイテム一覧取得
	app.get("/items", async (c) => {
		try {
			const { feedId, limit = "20", offset = "0" } = c.req.query();

			const items = await rssFeedItemService.getItems({
				feedId: feedId ? Number(feedId) : undefined,
				limit: Number(limit),
				offset: Number(offset),
			});

			return c.json({
				items: items.items,
				total: items.total,
				hasMore: items.hasMore,
			});
		} catch (error) {
			console.error("Failed to get RSS feed items:", error);
			throw new HTTPException(500, { message: "Failed to get RSS feed items" });
		}
	});

	return app;
};