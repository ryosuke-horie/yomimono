import { describe, expect, it, vi } from "vitest";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";
import type { BookmarkService } from "../../../src/services/bookmark";

// Honoのコンテキスト型定義
type HonoContext = {
	req: { path: string };
	env: Record<string, unknown>;
	executionCtx: {
		waitUntil?: (promise: Promise<unknown>) => void;
		passThroughOnException?: () => void;
	};
};

describe("ブックマークルーター", () => {
	describe("GET /unread", () => {
		it("未読ブックマークと総未読数を返すべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn().mockResolvedValue([
					{
						id: 1,
						url: "https://example.com",
						title: "Example",
						isRead: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
				getUnreadBookmarksCount: vi.fn().mockResolvedValue(5),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
			const request = new Request("http://localhost/unread");
			const context: HonoContext = {
				req: { path: "/unread" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれたことを確認
			expect(mockService.getUnreadBookmarks).toHaveBeenCalled();
			expect(mockService.getUnreadBookmarksCount).toHaveBeenCalled();

			// レスポンスを確認
			expect(response.status).toBe(200);
			expect(data).toEqual({
				success: true,
				bookmarks: expect.any(Array),
				totalUnread: 5,
			});
		});

		it("エラーを適切に処理するべき", async () => {
			// エラーを返すモックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn().mockRejectedValue(new Error("Test error")),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
			const request = new Request("http://localhost/unread");
			const context: HonoContext = {
				req: { path: "/unread" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// レスポンスを確認
			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to fetch unread bookmarks",
			});
		});
	});

	describe("POST /bulk", () => {
		it("ブックマークを正常に作成するべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn().mockResolvedValue(undefined),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
			const bookmarksData = [
				{ url: "https://example.com", title: "Example" },
				{ url: "https://test.com", title: "Test" },
			];
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks: bookmarksData }),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれたことを確認
			expect(mockService.createBookmarksFromData).toHaveBeenCalledWith(
				bookmarksData,
			);

			// レスポンスを確認
			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("ブックマークが配列でない場合400を返すべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// 無効なデータのモックリクエスト
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks: "not an array" }),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれなかったことを確認
			expect(mockService.createBookmarksFromData).not.toHaveBeenCalled();

			// レスポンスを確認
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks must be an array",
			});
		});

		it("ブックマーク配列が空の場合400を返すべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// 空配列のモックリクエスト
			const request = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks: [] }),
			});
			const context: HonoContext = {
				req: { path: "/bulk" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれなかったことを確認
			expect(mockService.createBookmarksFromData).not.toHaveBeenCalled();

			// レスポンスを確認
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks array cannot be empty",
			});
		});

		it("URL形式が無効な場合400を返すべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// 無効なURLのモックリクエスト
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

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれなかったことを確認
			expect(mockService.createBookmarksFromData).not.toHaveBeenCalled();

			// レスポンスを確認
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "invalid URL format",
			});
		});

		it("サービスエラーを処理するべき", async () => {
			// エラーを返すモックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi
					.fn()
					.mockRejectedValue(new Error("Test error")),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
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

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// レスポンスを確認
			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to create bookmarks",
			});
		});
	});

	describe("PATCH /:id/read", () => {
		it("ブックマークを既読にマークするべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn().mockResolvedValue(undefined),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
			const request = new Request("http://localhost/123/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/123/read" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれたことを確認
			expect(mockService.markBookmarkAsRead).toHaveBeenCalledWith(123);

			// レスポンスを確認
			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("無効なブックマークIDの場合400を返すべき", async () => {
			// モックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// 無効なIDのモックリクエスト
			const request = new Request("http://localhost/invalid/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/invalid/read" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// サービスが呼ばれなかったことを確認
			expect(mockService.markBookmarkAsRead).not.toHaveBeenCalled();

			// レスポンスを確認
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "Invalid bookmark ID",
			});
		});

		it("ブックマークが見つからない場合404を返すべき", async () => {
			// エラーを返すモックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi
					.fn()
					.mockRejectedValue(new Error("Bookmark not found")),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
			const request = new Request("http://localhost/999/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/999/read" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// レスポンスを確認
			expect(response.status).toBe(404);
			expect(data).toEqual({
				success: false,
				message: "Bookmark not found",
			});
		});

		it("一般的なサービスエラーを処理するべき", async () => {
			// エラーを返すモックサービス
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi
					.fn()
					.mockRejectedValue(new Error("General error")),
				createBookmarksFromData: vi.fn(),
			};

			// モックサービスでルーターを作成
			const router = createBookmarksRouter(mockService);

			// モックリクエスト
			const request = new Request("http://localhost/123/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/123/read" },
				env: {},
				executionCtx: {},
			};

			// ハンドラー実行
			const response = await router.fetch(request, context);
			const data = await response.json();

			// レスポンスを確認
			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to mark bookmark as read",
			});
		});
	});
});
