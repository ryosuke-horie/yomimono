import { Hono } from "hono";
import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
	createErrorResponse,
	createErrorResponseBody,
} from "../exceptions";
import type { BookmarkWithLabel } from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark";
import type { ILabelService } from "../interfaces/service/label";
import {
	validateId,
	validateIdArray,
	validateOptionalString,
	validateRequestBody,
	validateRequiredString,
} from "../utils/validation";

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
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	app.get("/unlabeled", async (c) => {
		try {
			const bookmarks = await bookmarkService.getUnlabeledBookmarks();
			return c.json({ success: true, bookmarks });
		} catch (error) {
			console.error("Failed to fetch unlabeled bookmarks:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	app.put("/:id/label", async (c) => {
		try {
			const id = validateId(c.req.param("id"), "bookmark ID");

			let body: { labelName?: string };
			try {
				body = await c.req.json();
			} catch (e) {
				throw new BadRequestError("Invalid request body");
			}

			validateRequestBody(body);
			const labelName = validateRequiredString(body.labelName, "labelName");

			// labelServiceを使ってラベルを付与 (正規化はサービス内で行う)
			const assignedLabel = await labelService.assignLabel(id, labelName);
			return c.json({ success: true, label: assignedLabel });
		} catch (error) {
			if (error instanceof Error && !(error instanceof BadRequestError)) {
				if (error.message.includes("not found")) {
					const notFoundError = new NotFoundError(error.message);
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
				if (error.message.includes("already assigned")) {
					const conflictError = new ConflictError(error.message);
					return c.json(createErrorResponseBody(conflictError), 409);
				}
				if (error.message.includes("cannot be empty")) {
					const badRequestError = new BadRequestError(error.message);
					return c.json(createErrorResponseBody(badRequestError), 400);
				}
			}
			console.error("Failed to assign label:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	app.post("/bulk", async (c) => {
		try {
			const { bookmarks } = await c.req.json<{
				bookmarks: Array<{ url: string; title: string }>;
			}>();

			if (!Array.isArray(bookmarks)) {
				throw new BadRequestError("bookmarks must be an array");
			}

			if (bookmarks.length === 0) {
				throw new BadRequestError("bookmarks array cannot be empty");
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
				throw new BadRequestError("invalid URL format");
			}

			const totalCount = bookmarks.length;
			await bookmarkService.createBookmarksFromData(bookmarks);
			return c.json({
				success: true,
				message: `Processed ${totalCount} bookmarks (duplicates skipped if unread)`,
			});
		} catch (error) {
			console.error("Failed to create bookmarks:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	// お気に入り機能のルーティングを追加
	app.post("/:id/favorite", async (c) => {
		try {
			const id = validateId(c.req.param("id"), "bookmark ID");

			await bookmarkService.addToFavorites(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error && !(error instanceof BadRequestError)) {
				if (error.message === "Bookmark not found") {
					const notFoundError = new NotFoundError("Bookmark not found");
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
				if (error.message === "Already favorited") {
					const conflictError = new ConflictError("Already added to favorites");
					return c.json(createErrorResponseBody(conflictError), 409);
				}
			}
			console.error("Failed to add to favorites:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	app.delete("/:id/favorite", async (c) => {
		try {
			const id = validateId(c.req.param("id"), "bookmark ID");

			await bookmarkService.removeFromFavorites(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error && !(error instanceof BadRequestError)) {
				if (error.message === "Favorite not found") {
					const notFoundError = new NotFoundError("Favorite not found");
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
			}
			console.error("Failed to remove from favorites:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	app.get("/favorites", async (c) => {
		try {
			const result = await bookmarkService.getFavoriteBookmarks();
			return c.json({ success: true, ...result });
		} catch (error) {
			console.error("Failed to fetch favorites:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	// 既読機能
	app.patch("/:id/read", async (c) => {
		try {
			const id = validateId(c.req.param("id"), "bookmark ID");

			await bookmarkService.markBookmarkAsRead(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error && error.message === "Bookmark not found") {
				const notFoundError = new NotFoundError("Bookmark not found");
				return c.json(createErrorResponseBody(notFoundError), 404);
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
			const id = validateId(c.req.param("id"), "bookmark ID");

			await bookmarkService.markBookmarkAsUnread(id);
			return c.json({ success: true });
		} catch (error) {
			if (error instanceof Error && error.message === "Bookmark not found") {
				const notFoundError = new NotFoundError("Bookmark not found");
				return c.json(createErrorResponseBody(notFoundError), 404);
			}
			console.error("Failed to mark bookmark as unread:", error);
			// For general errors, preserve the original error message format
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
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
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
			const errorResponse = createErrorResponse(
				new InternalServerError("既読ブックマークの取得に失敗しました"),
			);
			return c.json(
				createErrorResponseBody(
					new InternalServerError("既読ブックマークの取得に失敗しました"),
				),
				errorResponse.statusCode as any,
			);
		}
	});

	app.get("/unrated", async (c) => {
		try {
			const unratedBookmarks = await bookmarkService.getUnratedBookmarks();
			return c.json({ success: true, bookmarks: unratedBookmarks });
		} catch (error) {
			console.error("Failed to fetch unrated bookmarks:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	// 一括ラベル付け
	app.put("/batch-label", async (c) => {
		try {
			const body = validateRequestBody<{
				articleIds?: number[];
				labelName?: string;
				description?: string;
			}>(await c.req.json());

			const articleIds = validateIdArray(body.articleIds, "articleIds");
			const labelName = validateRequiredString(body.labelName, "labelName");
			const description = validateOptionalString(
				body.description,
				"description",
			);

			// labelServiceを使って一括ラベル付け
			const result = await labelService.assignLabelsToMultipleArticles(
				articleIds,
				labelName,
				description,
			);

			return c.json({ success: true, ...result });
		} catch (error) {
			if (error instanceof Error && !(error instanceof BadRequestError)) {
				if (error.message.includes("Invalid article ID")) {
					throw new BadRequestError(error.message);
				}
				if (error.message.includes("cannot be empty")) {
					throw new BadRequestError(error.message);
				}
			}
			console.error("Failed to batch assign labels:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				errorResponse.statusCode as any,
			);
		}
	});

	return app;
};
