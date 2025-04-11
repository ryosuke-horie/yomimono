import { describe, expect, it, vi } from "vitest";
import type { BookmarkService } from "../../../src/interfaces/service/bookmark";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

// Honoのコンテキスト型定義
type HonoContext = {
	req: { path: string };
	env: Record<string, unknown>;
	executionCtx: {
		waitUntil?: (promise: Promise<unknown>) => void;
		passThroughOnException?: () => void;
	};
};

describe("BookmarkRouter", () => {
	describe("お気に入り機能", () => {
		describe("POST /:id/favorite", () => {
			it("お気に入りに追加できること", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					getTodayReadCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn().mockResolvedValue(undefined),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/123/favorite", {
					method: "POST",
				});
				const context: HonoContext = {
					req: { path: "/123/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(mockService.addToFavorites).toHaveBeenCalledWith(123);
				expect(response.status).toBe(200);
				expect(data).toEqual({ success: true });
			});

			it("無効なIDの場合400を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					getTodayReadCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/invalid/favorite", {
					method: "POST",
				});
				const context: HonoContext = {
					req: { path: "/invalid/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data).toEqual({
					success: false,
					message: "Invalid bookmark ID",
				});
			});

			it("存在しないブックマークの場合404を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					getTodayReadCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi
						.fn()
						.mockRejectedValue(new Error("Bookmark not found")),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/999/favorite", {
					method: "POST",
				});
				const context: HonoContext = {
					req: { path: "/999/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(404);
				expect(data).toEqual({
					success: false,
					message: "Bookmark not found",
				});
			});

			it("既にお気に入り済みの場合409を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					getTodayReadCount: vi.fn(),
					addToFavorites: vi
						.fn()
						.mockRejectedValue(new Error("Already favorited")),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/123/favorite", {
					method: "POST",
				});
				const context: HonoContext = {
					req: { path: "/123/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(409);
				expect(data).toEqual({
					success: false,
					message: "Already added to favorites",
				});
			});
		});

		describe("DELETE /:id/favorite", () => {
			it("お気に入りから削除できること", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					getTodayReadCount: vi.fn(),
					removeFromFavorites: vi.fn().mockResolvedValue(undefined),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/123/favorite", {
					method: "DELETE",
				});
				const context: HonoContext = {
					req: { path: "/123/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(mockService.removeFromFavorites).toHaveBeenCalledWith(123);
				expect(response.status).toBe(200);
				expect(data).toEqual({ success: true });
			});

			it("無効なIDの場合400を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					getTodayReadCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/invalid/favorite", {
					method: "DELETE",
				});
				const context: HonoContext = {
					req: { path: "/invalid/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data).toEqual({
					success: false,
					message: "Invalid bookmark ID",
				});
			});

			it("存在しないお気に入りの場合404を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					getTodayReadCount: vi.fn(),
					removeFromFavorites: vi
						.fn()
						.mockRejectedValue(new Error("Favorite not found")),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/999/favorite", {
					method: "DELETE",
				});
				const context: HonoContext = {
					req: { path: "/999/favorite" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(404);
				expect(data).toEqual({
					success: false,
					message: "Favorite not found",
				});
			});
		});

		describe("GET /favorites", () => {
			it("お気に入り一覧を取得できること", async () => {
				const mockBookmarks = [
					{
						id: 1,
						url: "https://example.com",
						title: "Example",
						isRead: false,
						isFavorite: true,
						createdAt: "2025-04-05T00:52:55.875Z",
						updatedAt: "2025-04-05T00:52:55.875Z",
					},
				];
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					removeFromFavorites: vi.fn(),
					getTodayReadCount: vi.fn(),
					getFavoriteBookmarks: vi.fn().mockResolvedValue({
						bookmarks: mockBookmarks,
						pagination: {
							currentPage: 1,
							totalPages: 1,
							totalItems: 1,
						},
					}),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/favorites");
				const context: HonoContext = {
					req: { path: "/favorites" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(200);
				expect(data).toEqual({
					success: true,
					bookmarks: mockBookmarks,
					pagination: {
						currentPage: 1,
						totalPages: 1,
						totalItems: 1,
					},
				});
			});

			it("無効なページ番号の場合400を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					getTodayReadCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/favorites?page=invalid");
				const context: HonoContext = {
					req: { path: "/favorites" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data).toEqual({
					success: false,
					message: "Invalid pagination parameters",
					errors: expect.any(Array),
				});
			});

			it("無効な表示件数の場合400を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi.fn(),
					getTodayReadCount: vi.fn(),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/favorites?limit=1000");
				const context: HonoContext = {
					req: { path: "/favorites" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data).toEqual({
					success: false,
					message: "Invalid pagination parameters",
					errors: expect.any(Array),
				});
			});

			it("エラー時に500を返すこと", async () => {
				const mockService: BookmarkService = {
					getUnreadBookmarks: vi.fn(),
					getUnreadBookmarksCount: vi.fn(),
					markBookmarkAsRead: vi.fn(),
					getTodayReadCount: vi.fn(),
					createBookmarksFromData: vi.fn(),
					addToFavorites: vi.fn(),
					removeFromFavorites: vi.fn(),
					getFavoriteBookmarks: vi
						.fn()
						.mockRejectedValue(new Error("Database error")),
				};

				const router = createBookmarksRouter(mockService);
				const request = new Request("http://localhost/favorites");
				const context: HonoContext = {
					req: { path: "/favorites" },
					env: {},
					executionCtx: {},
				};

				const response = await router.fetch(request, context);
				const data = await response.json();

				expect(response.status).toBe(500);
				expect(data).toEqual({
					success: false,
					message: "Failed to fetch favorites",
				});
			});
		});
	});

	describe("GET /unread", () => {
		it("未読ブックマーク一覧と総数、当日の既読数を取得できること", async () => {
			const mockBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "Example",
					isRead: false,
					isFavorite: false,
					createdAt: "2025-04-05T00:52:55.875Z",
					updatedAt: "2025-04-05T00:52:55.875Z",
				},
			];
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn().mockResolvedValue(mockBookmarks),
				getUnreadBookmarksCount: vi.fn().mockResolvedValue(1),
				getTodayReadCount: vi.fn().mockResolvedValue(5),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/unread");
			const context: HonoContext = {
				req: { path: "/unread" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({
				success: true,
				bookmarks: mockBookmarks,
				totalUnread: 1,
				todayReadCount: 5,
			});
		});

		it("エラー時に500を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi
					.fn()
					.mockRejectedValue(new Error("Database error")),
				getUnreadBookmarksCount: vi
					.fn()
					.mockRejectedValue(new Error("Database error")),
				getTodayReadCount: vi
					.fn()
					.mockRejectedValue(new Error("Database error")),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/unread");
			const context: HonoContext = {
				req: { path: "/unread" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to fetch unread bookmarks",
			});
		});
	});

	describe("POST /bulk", () => {
		it("複数のブックマークを作成できること", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				getTodayReadCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn().mockResolvedValue(undefined),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookmarks: [
						{ url: "https://example.com", title: "Example" },
						{ url: "https://example2.com", title: "Example 2" },
					],
				}),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(mockService.createBookmarksFromData).toHaveBeenCalledWith([
				{ url: "https://example.com", title: "Example" },
				{ url: "https://example2.com", title: "Example 2" },
			]);
			expect(data).toEqual({
				success: true,
				message: "Processed 2 bookmarks (duplicates skipped if unread)",
			});
		});

		it("bookmarksがない場合400を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				getTodayReadCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks must be an array",
			});
		});

		it("bookmarksが配列でない場合400を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookmarks: "not an array",
				}),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks must be an array",
			});
		});

		it("空配列の場合400を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookmarks: [],
				}),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks array cannot be empty",
			});
		});

		it("無効なURLの場合400を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookmarks: [{ url: "invalid-url", title: "Invalid" }],
				}),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "invalid URL format",
			});
		});

		it("エラー時に500を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi
					.fn()
					.mockRejectedValue(new Error("Database error")),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookmarks: [{ url: "https://example.com", title: "Example" }],
				}),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to create bookmarks",
			});
		});
	});

	describe("PATCH /:id/read", () => {
		it("ブックマークを既読にできること", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn().mockResolvedValue(undefined),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/123/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/123/read" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(mockService.markBookmarkAsRead).toHaveBeenCalledWith(123);
			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("無効なIDの場合400を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/invalid/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/invalid/read" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "Invalid bookmark ID",
			});
		});

		it("存在しないブックマークの場合404を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				getTodayReadCount: vi.fn(),
				markBookmarkAsRead: vi
					.fn()
					.mockRejectedValue(new Error("Bookmark not found")),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/999/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/999/read" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data).toEqual({
				success: false,
				message: "Bookmark not found",
			});
		});

		it("エラー時に500を返すこと", async () => {
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi
					.fn()
					.mockRejectedValue(new Error("Database error")),
				createBookmarksFromData: vi.fn(),
				addToFavorites: vi.fn(),
				removeFromFavorites: vi.fn(),
				getFavoriteBookmarks: vi.fn(),
				getTodayReadCount: vi.fn(),
			};

			const router = createBookmarksRouter(mockService);
			const request = new Request("http://localhost/123/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/123/read" },
				env: {},
				executionCtx: {},
			};

			const response = await router.fetch(request, context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to mark bookmark as read",
			});
		});
	});
});
