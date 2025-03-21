import { describe, expect, it, vi } from "vitest";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";
import type { BookmarkService } from "../../../src/services/bookmark";

// Hono用のコンテキスト型定義
type HonoContext = {
	req: { path: string };
	env: Record<string, unknown>;
	executionCtx: {
		waitUntil?: (promise: Promise<unknown>) => void;
		passThroughOnException?: () => void;
	};
};

describe("BookmarksRouter", () => {
	describe("GET /unread", () => {
		it("should return bookmarks and total unread count", async () => {
			// Mock service
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

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
			const request = new Request("http://localhost/unread");
			const context: HonoContext = {
				req: { path: "/unread" },
				env: {},
				executionCtx: {},
			};

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was called
			expect(mockService.getUnreadBookmarks).toHaveBeenCalled();
			expect(mockService.getUnreadBookmarksCount).toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(200);
			expect(data).toEqual({
				success: true,
				bookmarks: expect.any(Array),
				totalUnread: 5,
			});
		});

		it("should handle errors properly", async () => {
			// Mock service with error
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn().mockRejectedValue(new Error("Test error")),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
			const request = new Request("http://localhost/unread");
			const context: HonoContext = {
				req: { path: "/unread" },
				env: {},
				executionCtx: {},
			};

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify response
			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to fetch unread bookmarks",
			});
		});
	});
});
