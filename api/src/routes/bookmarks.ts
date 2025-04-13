import { Hono } from "hono";
import { z } from "zod";
import type { BookmarkWithLabel } from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark"; // Use IBookmarkService
import type { ILabelService } from "../interfaces/service/label"; // Import ILabelService
// Removed unused import of normalizeLabelName

// Accept both services
export const createBookmarksRouter = (
	bookmarkService: IBookmarkService,
	labelService: ILabelService,
) => {
	const app = new Hono();

	// GET /unread と GET /?label=... を統合 (ルートパスに変更)
	app.get("/", async (c) => {
		const labelQuery = c.req.query("label");

		try {
			let bookmarks: BookmarkWithLabel[];
			if (labelQuery) {
				// ラベルによるフィルタリング
				// Note: サービス層で正規化するか、ここで正規化するか要検討。
				//       ここではサービス層が正規化済みを期待すると仮定。
				// const normalizedLabel = normalizeLabelName(labelQuery);
				bookmarks = await bookmarkService.getBookmarksByLabel(labelQuery);
				// ラベルフィルタリング時はカウント不要かもしれないが、一旦そのまま
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

	// --- New Endpoints ---
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
				// JSON parsing failed (e.g., empty body)
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
	// --- End New Endpoints ---

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
