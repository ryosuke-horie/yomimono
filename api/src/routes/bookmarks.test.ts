import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bookmark } from "../db/schema";
import { NotFoundError } from "../exceptions";
import type { Env } from "../index";
import type { BookmarkWithFavorite } from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark";
import { createBookmarksRouter } from "./bookmarks";

// interface PaginationResponse {
// 	success: boolean;
// 	bookmarks: BookmarkWithFavorite[];
// 	pagination: {
// 		currentPage: number;
// 		totalPages: number;
// 		totalItems: number;
// 	};
// }

const mockGetUnreadBookmarks = vi.fn();
const mockGetUnreadBookmarksCount = vi.fn();
const mockGetTodayReadCount = vi.fn();
const mockMarkBookmarkAsRead = vi.fn();
const mockMarkBookmarkAsUnread = vi.fn();
const mockCreateBookmarksFromData = vi.fn();
const mockAddToFavorites = vi.fn();
const mockRemoveFromFavorites = vi.fn();
const mockGetFavoriteBookmarks = vi.fn();
const mockGetRecentlyReadBookmarks = vi.fn();

const mockBookmarkService: IBookmarkService = {
	getUnreadBookmarks: mockGetUnreadBookmarks,
	getUnreadBookmarksCount: mockGetUnreadBookmarksCount,
	getTodayReadCount: mockGetTodayReadCount,
	markBookmarkAsRead: mockMarkBookmarkAsRead,
	markBookmarkAsUnread: mockMarkBookmarkAsUnread,
	createBookmarksFromData: mockCreateBookmarksFromData,
	addToFavorites: mockAddToFavorites,
	removeFromFavorites: mockRemoveFromFavorites,
	getFavoriteBookmarks: mockGetFavoriteBookmarks,
	getRecentlyReadBookmarks: mockGetRecentlyReadBookmarks,
};

describe("BookmarkRouter", () => {
	let app: Hono<{ Bindings: Env }>;

	const mockBookmark1: Bookmark = {
		id: 1,
		url: "https://example.com/1",
		title: "Example 1",
		isRead: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const expectedResult1: BookmarkWithFavorite = {
		...mockBookmark1,
		isFavorite: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env }>();
		const router = createBookmarksRouter(mockBookmarkService);
		app.route("/api/bookmarks", router);
	});

	describe("GET /api/bookmarks/", () => {
		it("クエリパラメータなしの場合、未読ブックマーク一覧と総数、当日の既読数を取得できること", async () => {
			const mockBookmarks: BookmarkWithFavorite[] = [expectedResult1];
			mockGetUnreadBookmarks.mockResolvedValue(mockBookmarks);
			mockGetUnreadBookmarksCount.mockResolvedValue(1);
			mockGetTodayReadCount.mockResolvedValue(5);

			const res = await app.request("/api/bookmarks");
			const data = (await res.json()) as {
				success: boolean;
				bookmarks: BookmarkWithFavorite[];
				totalUnread: number;
				todayReadCount: number;
			};

			expect(res.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.bookmarks).toHaveLength(1);
			expect(data.bookmarks[0].id).toBe(expectedResult1.id);
			expect(data.totalUnread).toBe(1);
			expect(data.todayReadCount).toBe(5);
			expect(mockGetUnreadBookmarks).toHaveBeenCalledOnce();
			expect(mockGetUnreadBookmarksCount).toHaveBeenCalledOnce();
			expect(mockGetTodayReadCount).toHaveBeenCalledOnce();
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Service error");
			mockGetUnreadBookmarks.mockRejectedValue(error);

			const res = await app.request("/api/bookmarks");
			const data = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(data.success).toBe(false);
			expect(data.message).toBe("Service error");
		});
	});

	describe("お気に入り機能 (app.request)", () => {
		describe("POST /api/bookmarks/:id/favorite", () => {
			it("お気に入りに追加できること", async () => {
				mockAddToFavorites.mockResolvedValue(undefined);
				const res = await app.request("/api/bookmarks/123/favorite", {
					method: "POST",
				});
				const data = (await res.json()) as { success: boolean };

				expect(mockAddToFavorites).toHaveBeenCalledWith(123);
				expect(res.status).toBe(200);
				expect(data).toEqual({ success: true });
			});

			it("存在しないブックマークの場合404を返すこと", async () => {
				mockAddToFavorites.mockRejectedValue(
					new NotFoundError("ブックマークが見つかりません"),
				);
				const res = await app.request("/api/bookmarks/999/favorite", {
					method: "POST",
				});
				const data = (await res.json()) as {
					success: boolean;
					message: string;
				};
				expect(res.status).toBe(404);
				expect(data).toEqual({
					success: false,
					message: "ブックマークが見つかりません",
				});
			});
		});

		describe("DELETE /api/bookmarks/:id/favorite", () => {
			it("お気に入りから削除できること", async () => {
				mockRemoveFromFavorites.mockResolvedValue(undefined);
				const res = await app.request("/api/bookmarks/123/favorite", {
					method: "DELETE",
				});
				const data = (await res.json()) as { success: boolean };
				expect(mockRemoveFromFavorites).toHaveBeenCalledWith(123);
				expect(res.status).toBe(200);
				expect(data).toEqual({ success: true });
			});

			it("存在しないお気に入りの場合404を返すこと", async () => {
				mockRemoveFromFavorites.mockRejectedValue(
					new NotFoundError("お気に入りが見つかりません"),
				);
				const res = await app.request("/api/bookmarks/999/favorite", {
					method: "DELETE",
				});
				const data = (await res.json()) as {
					success: boolean;
					message: string;
				}; // Add type assertion
				expect(res.status).toBe(404);
				expect(data).toEqual({
					success: false,
					message: "お気に入りが見つかりません",
				});
			});
		});

		describe("GET /api/bookmarks/favorites", () => {
			it("お気に入り一覧を取得できること", async () => {
				const mockBookmarks: BookmarkWithFavorite[] = [expectedResult1];
				const mockResponse = {
					bookmarks: mockBookmarks,
				};
				mockGetFavoriteBookmarks.mockResolvedValue(mockResponse);

				const res = await app.request("/api/bookmarks/favorites");
				const data = (await res.json()) as {
					success: boolean;
					bookmarks: BookmarkWithFavorite[];
				};

				expect(res.status).toBe(200);
				expect(data.success).toBe(true);
				expect(data.bookmarks).toHaveLength(1);
				expect(mockGetFavoriteBookmarks).toHaveBeenCalledWith(); // 引数なしで呼び出されることを確認
			});

			it("エラー時に500を返すこと", async () => {
				mockGetFavoriteBookmarks.mockRejectedValue(new Error("Database error"));
				const res = await app.request("/api/bookmarks/favorites");
				const data = (await res.json()) as {
					success: boolean;
					message: string;
				};
				expect(res.status).toBe(500);
				expect(data).toEqual({
					success: false,
					message: "Database error",
				});
			});
		});
	});

	describe("POST /api/bookmarks/bulk", () => {
		it("複数のブックマークを作成できること", async () => {
			const bookmarksPayload = [
				{ url: "https://example.com", title: "Example" },
				{ url: "https://example2.com", title: "Example 2" },
			];
			mockCreateBookmarksFromData.mockResolvedValue(undefined);

			const res = await app.request("/api/bookmarks/bulk", {
				method: "POST",
				body: JSON.stringify({ bookmarks: bookmarksPayload }),
				headers: { "Content-Type": "application/json" },
			});
			const data = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(200);
			expect(mockCreateBookmarksFromData).toHaveBeenCalledWith(
				bookmarksPayload,
			);
			expect(data).toEqual({
				success: true,
				message: "Processed 2 bookmarks (duplicates skipped if unread)",
			});
		});

		it("エラー時に500を返すこと", async () => {
			mockCreateBookmarksFromData.mockRejectedValue(
				new Error("Database error"),
			);
			const res = await app.request("/api/bookmarks/bulk", {
				method: "POST",
				body: JSON.stringify({
					bookmarks: [{ url: "https://example.com", title: "Fail" }],
				}),
				headers: { "Content-Type": "application/json" },
			});
			const data = (await res.json()) as { success: boolean; message: string };
			expect(res.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Database error",
			});
		});
	});

	describe("PATCH /api/bookmarks/:id/read", () => {
		it("ブックマークを既読にできること", async () => {
			mockMarkBookmarkAsRead.mockResolvedValue(undefined);
			const res = await app.request("/api/bookmarks/123/read", {
				method: "PATCH",
			});
			const data = (await res.json()) as { success: boolean };

			expect(mockMarkBookmarkAsRead).toHaveBeenCalledWith(123);
			expect(res.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("存在しないブックマークの場合404を返すこと", async () => {
			mockMarkBookmarkAsRead.mockRejectedValue(
				new NotFoundError("ブックマークが見つかりません"),
			);
			const res = await app.request("/api/bookmarks/999/read", {
				method: "PATCH",
			});
			const data = (await res.json()) as { success: boolean; message: string };
			expect(res.status).toBe(404);
			expect(data).toEqual({
				success: false,
				message: "ブックマークが見つかりません",
			});
		});

		it("エラー時に500を返すこと", async () => {
			mockMarkBookmarkAsRead.mockRejectedValue(new Error("Database error"));
			const res = await app.request("/api/bookmarks/123/read", {
				method: "PATCH",
			});
			const data = (await res.json()) as { success: boolean; message: string };
			expect(res.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to mark bookmark as read",
			});
		});
	});

	describe("GET /api/bookmarks/recent", () => {
		it("最近読んだブックマークを取得できること", async () => {
			const mockRecent: { [date: string]: BookmarkWithFavorite[] } = {
				"2025-04-13": [expectedResult1],
			};
			mockGetRecentlyReadBookmarks.mockResolvedValue(mockRecent);

			const res = await app.request("/api/bookmarks/recent");
			const data = (await res.json()) as {
				success: boolean;
				bookmarks: { [date: string]: BookmarkWithFavorite[] };
			};

			expect(res.status).toBe(200);
			expect(data.success).toBe(true);
			expect(Object.keys(data.bookmarks)).toEqual(Object.keys(mockRecent));
			expect(mockGetRecentlyReadBookmarks).toHaveBeenCalledOnce();
		});

		it("エラー時に500を返すこと", async () => {
			mockGetRecentlyReadBookmarks.mockRejectedValue(
				new Error("Database error"),
			);
			const res = await app.request("/api/bookmarks/recent");
			const data = (await res.json()) as { success: boolean; message: string };
			expect(res.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Database error",
			});
		});
	});
});
