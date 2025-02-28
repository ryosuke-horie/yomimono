import { Hono } from "hono";
import type { BookmarkService } from "../services/bookmark";

export const createBookmarksRouter = (bookmarkService: BookmarkService) => {
	const app = new Hono();

	app.post("/bulk", async (c) => {
		try {
			const { urls } = await c.req.json<{ urls: string[] }>();

			// バリデーション
			if (!Array.isArray(urls)) {
				return c.json(
					{ success: false, message: "urls must be an array" },
					400,
				);
			}

			if (urls.length === 0 || urls.length > 10) {
				return c.json(
					{ success: false, message: "urls must contain 1-10 items" },
					400,
				);
			}

			// URLの形式チェック
			const isValidUrl = (url: string) => {
				try {
					new URL(url);
					return true;
				} catch {
					return false;
				}
			};

			if (!urls.every(isValidUrl)) {
				return c.json({ success: false, message: "invalid URL format" }, 400);
			}

			await bookmarkService.createBookmarksFromUrls(urls);
			return c.json({ success: true });
		} catch (error) {
			console.error("Failed to create bookmarks:", error);
			return c.json(
				{ success: false, message: "Failed to create bookmarks" },
				500,
			);
		}
	});

	return app;
};
