import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../../../src/exceptions";
import type { Env } from "../../../src/index";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

describe("Bookmark Unread Endpoint", () => {
	let app: Hono<{ Bindings: Env }>;

	const mockMarkBookmarkAsUnread = vi.fn();

	const mockBookmarkService: IBookmarkService = {
		getUnreadBookmarks: vi.fn(),
		getUnreadBookmarksCount: vi.fn(),
		getTodayReadCount: vi.fn(),
		markBookmarkAsRead: vi.fn(),
		markBookmarkAsUnread: mockMarkBookmarkAsUnread,
		createBookmarksFromData: vi.fn(),
		addToFavorites: vi.fn(),
		removeFromFavorites: vi.fn(),
		getFavoriteBookmarks: vi.fn(),
		getRecentlyReadBookmarks: vi.fn(),
		getUnlabeledBookmarks: vi.fn(),
		getBookmarksByLabel: vi.fn(),
		getUnratedBookmarks: vi.fn(),
		getReadBookmarks: vi.fn(),
	};
	const mockLabelService: ILabelService = {
		getLabels: vi.fn(),
		assignLabel: vi.fn(),
		createLabel: vi.fn(),
		deleteLabel: vi.fn(),
		assignLabelsToMultipleArticles: vi.fn(),
		getLabelById: vi.fn(),
		updateLabelDescription: vi.fn(),
		cleanupUnusedLabels: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env }>();
		const router = createBookmarksRouter(mockBookmarkService, mockLabelService);
		app.route("/api/bookmarks", router);
	});

	describe("PATCH /api/bookmarks/:id/unread", () => {
		it("ブックマークを未読に戻せること", async () => {
			mockMarkBookmarkAsUnread.mockResolvedValue(undefined);
			const res = await app.request("/api/bookmarks/123/unread", {
				method: "PATCH",
			});
			const data = (await res.json()) as { success: boolean };

			expect(mockMarkBookmarkAsUnread).toHaveBeenCalledWith(123);
			expect(res.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("存在しないブックマークの場合404を返すこと", async () => {
			mockMarkBookmarkAsUnread.mockRejectedValue(
				new NotFoundError("ブックマークが見つかりません"),
			);
			const res = await app.request("/api/bookmarks/999/unread", {
				method: "PATCH",
			});
			const data = (await res.json()) as { success: boolean; message: string };
			expect(res.status).toBe(404);
			expect(data).toEqual({ success: false, message: "ブックマークが見つかりません" });
		});

		it("エラー時に500を返すこと", async () => {
			mockMarkBookmarkAsUnread.mockRejectedValue(new Error("Database error"));
			const res = await app.request("/api/bookmarks/123/unread", {
				method: "PATCH",
			});
			const data = (await res.json()) as { success: boolean; message: string };
			expect(res.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to mark bookmark as unread",
			});
		});
	});
});
