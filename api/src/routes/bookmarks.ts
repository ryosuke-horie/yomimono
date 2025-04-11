import { Hono } from "hono";
import { z } from "zod";
import type { BookmarkService } from "../interfaces/service/bookmark";

export const createBookmarksRouter = (bookmarkService: BookmarkService) => {
	const app = new Hono();

	app.get("/unread", async (c) => {
		try {
			const [bookmarks, totalUnread, todayReadCount] = await Promise.all([
				bookmarkService.getUnreadBookmarks(),
				bookmarkService.getUnreadBookmarksCount(),
				bookmarkService.getTodayReadCount(),
			]);
			return c.json({ success: true, bookmarks, totalUnread, todayReadCount });
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

			const totalCount = bookmarks.length;
			await bookmarkService.createBookmarksFromData(bookmarks);
			return c.json({
				success: true,
				message: `Processed ${totalCount} bookmarks (duplicates skipped if unread)`,
			});
		} catch (error) {
			console.error("Failed to create bookmarks:", error);
			return c.json(
				{ success: false, message: "Failed to create bookmarks" },
				500,
			);
		}
	});

	// クエリパラメータのバリデーションスキーマ
	const paginationSchema = z.object({
		page: z.coerce.number().min(1).default(1),
		limit: z.coerce.number().min(1).max(100).default(20),
	});

	// お気に入り機能のルーティングを追加
	app.post("/:id/favorite", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
			}

			await bookmarkService.addToFavorites(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Bookmark not found") {
					return c.json({ success: false, message: "Bookmark not found" }, 404);
				}
				if (error.message === "Already favorited") {
					return c.json(
						{ success: false, message: "Already added to favorites" },
						409,
					);
				}
			}
			console.error("Failed to add to favorites:", error);
			return c.json(
				{ success: false, message: "Failed to add to favorites" },
				500,
			);
		}
	});

	app.delete("/:id/favorite", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
			}

			await bookmarkService.removeFromFavorites(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Favorite not found") {
					return c.json({ success: false, message: "Favorite not found" }, 404);
				}
			}
			console.error("Failed to remove from favorites:", error);
			return c.json(
				{ success: false, message: "Failed to remove from favorites" },
				500,
			);
		}
	});

	app.get("/favorites", async (c) => {
		try {
			const query = paginationSchema.parse({
				page: c.req.query("page"),
				limit: c.req.query("limit"),
			});

			const result = await bookmarkService.getFavoriteBookmarks(
				query.page,
				query.limit,
			);

			return c.json({ success: true, ...result });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						success: false,
						message: "Invalid pagination parameters",
						errors: error.errors,
					},
					400,
				);
			}
			console.error("Failed to fetch favorites:", error);
			return c.json(
				{ success: false, message: "Failed to fetch favorites" },
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

	app.get("/recent", async (c) => {
		try {
			const recentlyReadBookmarks =
				await bookmarkService.getRecentlyReadBookmarks();
			return c.json({ success: true, bookmarks: recentlyReadBookmarks });
		} catch (error) {
			console.error("Failed to fetch recently read bookmarks:", error);
			return c.json(
				{ success: false, message: "Failed to fetch recently read bookmarks" },
				500,
			);
		}
	});

	return app;
};
