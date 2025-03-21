import { Hono } from "hono";
import type { BookmarkService } from "../services/bookmark";

export const createBookmarksRouter = (bookmarkService: BookmarkService) => {
	const app = new Hono();

	app.get("/unread", async (c) => {
		try {
			const [bookmarks, totalUnread] = await Promise.all([
				bookmarkService.getUnreadBookmarks(),
				bookmarkService.getUnreadBookmarksCount(),
			]);
			return c.json({ success: true, bookmarks, totalUnread });
		} catch (error) {
			console.error("Failed to fetch unread bookmarks:", error);
			return c.json(
				{ success: false, message: "Failed to fetch unread bookmarks" },
				500,
			);
		}
	});

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

			if (bookmarks.length === 0) {
				return c.json(
					{ success: false, message: "bookmarks array cannot be empty" },
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

	// 既読機能
	app.patch("/:id/read", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
			}

			await bookmarkService.markBookmarkAsRead(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error && error.message === "Bookmark not found") {
				return c.json({ success: false, message: "Bookmark not found" }, 404);
			}
			console.error("Failed to mark bookmark as read:", error);
			return c.json(
				{ success: false, message: "Failed to mark bookmark as read" },
				500,
			);
		}
	});

	return app;
};
