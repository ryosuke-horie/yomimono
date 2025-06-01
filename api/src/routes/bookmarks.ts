import { Hono } from "hono";
import type { BookmarkWithLabel } from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark";
import type { ILabelService } from "../interfaces/service/label";

export const createBookmarksRouter = (
	bookmarkService: IBookmarkService,
	labelService: ILabelService,
) => {
	const app = new Hono();

	app.get("/", async (c) => {
		const labelQuery = c.req.query("label");

		try {
			let bookmarks: BookmarkWithLabel[];
			if (labelQuery) {
				// ラベルによるフィルタリング
				bookmarks = await bookmarkService.getBookmarksByLabel(labelQuery);
				const [totalUnread, todayReadCount] = await Promise.all([
					bookmarkService.getUnreadBookmarksCount(),
					bookmarkService.getTodayReadCount(),
				]);
				return c.json({
					success: true,
					bookmarks,
					totalUnread,
					todayReadCount,
				});
			}
			// 通常の未読取得
			const [unreadBookmarks, totalUnread, todayReadCount] = await Promise.all([
				bookmarkService.getUnreadBookmarks(),
				bookmarkService.getUnreadBookmarksCount(),
				bookmarkService.getTodayReadCount(),
			]);
			return c.json({
				success: true,
				bookmarks: unreadBookmarks,
				totalUnread,
				todayReadCount,
			});
		} catch (error) {
			console.error("Failed to fetch bookmarks:", error);
			return c.json(
				{ success: false, message: "Failed to fetch bookmarks" },
				500,
			);
		}
	});

	app.get("/unlabeled", async (c) => {
		try {
			const bookmarks = await bookmarkService.getUnlabeledBookmarks();
			return c.json({ success: true, bookmarks });
		} catch (error) {
			console.error("Failed to fetch unlabeled bookmarks:", error);
			return c.json(
				{ success: false, message: "Failed to fetch unlabeled bookmarks" },
				500,
			);
		}
	});

	app.put("/:id/label", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
			}

			let body: { labelName?: string };
			try {
				body = await c.req.json<{ labelName?: string }>();
			} catch (e) {
				return c.json({ success: false, message: "Invalid request body" }, 400);
			}

			const labelName = body?.labelName;

			if (
				!labelName ||
				typeof labelName !== "string" ||
				labelName.trim() === ""
			) {
				return c.json(
					{
						success: false,
						message: "labelName is required and must be a non-empty string",
					},
					400,
				);
			}

			// labelServiceを使ってラベルを付与 (正規化はサービス内で行う)
			const assignedLabel = await labelService.assignLabel(id, labelName);
			return c.json({ success: true, label: assignedLabel });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("not found")) {
					return c.json({ success: false, message: error.message }, 404);
				}
				if (error.message.includes("already assigned")) {
					return c.json({ success: false, message: error.message }, 409);
				}
				if (error.message.includes("cannot be empty")) {
					return c.json({ success: false, message: error.message }, 400);
				}
			}
			console.error("Failed to assign label:", error);
			return c.json({ success: false, message: "Failed to assign label" }, 500);
		}
	});

	app.post("/bulk", async (c) => {
		try {
			const { bookmarks } = await c.req.json<{
				bookmarks: Array<{ url: string; title: string }>;
			}>();

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
			const result = await bookmarkService.getFavoriteBookmarks();
			return c.json({ success: true, ...result });
		} catch (error) {
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

	// 未読に戻す機能
	app.patch("/:id/unread", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid bookmark ID" }, 400);
			}

			await bookmarkService.markBookmarkAsUnread(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error && error.message === "Bookmark not found") {
				return c.json({ success: false, message: "Bookmark not found" }, 404);
			}
			console.error("Failed to mark bookmark as unread:", error);
			return c.json(
				{ success: false, message: "Failed to mark bookmark as unread" },
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

	app.get("/read", async (c) => {
		try {
			const readBookmarks = await bookmarkService.getReadBookmarks();
			const bookmarksWithLabels = readBookmarks.map((bookmark) => ({
				id: bookmark.id,
				url: bookmark.url,
				title: bookmark.title,
				labels: bookmark.label ? [bookmark.label.name] : [],
				isRead: bookmark.isRead,
				isFavorite: bookmark.isFavorite,
				createdAt: bookmark.createdAt.toISOString(),
				readAt: bookmark.updatedAt.toISOString(),
			}));
			return c.json({ success: true, bookmarks: bookmarksWithLabels });
		} catch (error) {
			console.error("Failed to fetch read bookmarks:", error);
			return c.json(
				{ success: false, message: "既読ブックマークの取得に失敗しました" },
				500,
			);
		}
	});

	// 一括ラベル付け
	app.put("/batch-label", async (c) => {
		try {
			const body = await c.req.json<{
				articleIds?: number[];
				labelName?: string;
				description?: string;
			}>();

			// バリデーション
			if (
				!body.articleIds ||
				!Array.isArray(body.articleIds) ||
				body.articleIds.length === 0
			) {
				return c.json(
					{
						success: false,
						message: "articleIds is required and must be a non-empty array",
					},
					400,
				);
			}

			if (
				!body.labelName ||
				typeof body.labelName !== "string" ||
				body.labelName.trim() === ""
			) {
				return c.json(
					{
						success: false,
						message: "labelName is required and must be a non-empty string",
					},
					400,
				);
			}

			// 数値の配列であることを確認
			const articleIds = body.articleIds.map((id) => {
				const numId = Number(id);
				if (Number.isNaN(numId)) {
					throw new Error(`Invalid article ID: ${id}`);
				}
				return numId;
			});

			// labelServiceを使って一括ラベル付け
			const result = await labelService.assignLabelsToMultipleArticles(
				articleIds,
				body.labelName,
				body.description,
			);

			return c.json({ success: true, ...result });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("Invalid article ID")) {
					return c.json({ success: false, message: error.message }, 400);
				}
				if (error.message.includes("cannot be empty")) {
					return c.json({ success: false, message: error.message }, 400);
				}
			}
			console.error("Failed to batch assign labels:", error);
			return c.json(
				{ success: false, message: "Failed to batch assign labels" },
				500,
			);
		}
	});

	return app;
};
