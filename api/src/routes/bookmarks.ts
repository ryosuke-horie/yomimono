import { Hono } from "hono";
import type { BookmarkService } from "../services/bookmark";

export const createBookmarksRouter = (bookmarkService: BookmarkService) => {
	const app = new Hono();

	app.post("/bulk", async (c) => {
		try {
			const { bookmarks } = await c.req.json<{
				bookmarks: Array<{ url: string; title: string }>;
			}>();

			// バリデーション
			if (!Array.isArray(bookmarks)) {
				return c.json(
					{ success: false, message: "bookmarks must be an array" },
					400,
				);
			}

			if (bookmarks.length === 0 || bookmarks.length > 10) {
				return c.json(
					{ success: false, message: "bookmarks must contain 1-10 items" },
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

			if (!bookmarks.every((b) => isValidUrl(b.url))) {
				return c.json({ success: false, message: "invalid URL format" }, 400);
			}

			await bookmarkService.createBookmarksFromData(bookmarks);
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
