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

	describe("POST /bulk", () => {
		it("should create bookmarks successfully", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn().mockResolvedValue(undefined),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
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

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was called
			expect(mockService.createBookmarksFromData).toHaveBeenCalledWith(
				bookmarksData,
			);

			// Verify response
			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("should return 400 when bookmarks is not an array", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request with invalid data
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

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was not called
			expect(mockService.createBookmarksFromData).not.toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks must be an array",
			});
		});

		it("should return 400 when bookmarks array is empty", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request with empty array
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

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was not called
			expect(mockService.createBookmarksFromData).not.toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "bookmarks array cannot be empty",
			});
		});

		it("should return 400 when URL format is invalid", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request with invalid URL
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

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was not called
			expect(mockService.createBookmarksFromData).not.toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "invalid URL format",
			});
		});

		it("should handle service errors", async () => {
			// Mock service with error
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi
					.fn()
					.mockRejectedValue(new Error("Test error")),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
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

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify response
			expect(response.status).toBe(500);
			expect(data).toEqual({
				success: false,
				message: "Failed to create bookmarks",
			});
		});
	});

	describe("PATCH /:id/read", () => {
		it("should mark bookmark as read successfully", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn().mockResolvedValue(undefined),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
			const request = new Request("http://localhost/123/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/123/read" },
				env: {},
				executionCtx: {},
			};

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was called
			expect(mockService.markBookmarkAsRead).toHaveBeenCalledWith(123);

			// Verify response
			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("should return 400 for invalid bookmark ID", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi.fn(),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request with invalid ID
			const request = new Request("http://localhost/invalid/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/invalid/read" },
				env: {},
				executionCtx: {},
			};

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify service was not called
			expect(mockService.markBookmarkAsRead).not.toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(400);
			expect(data).toEqual({
				success: false,
				message: "Invalid bookmark ID",
			});
		});

		it("should return 404 when bookmark not found", async () => {
			// Mock service
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi
					.fn()
					.mockRejectedValue(new Error("Bookmark not found")),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
			const request = new Request("http://localhost/999/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/999/read" },
				env: {},
				executionCtx: {},
			};

			// Execute handler
			const response = await router.fetch(request, context);
			const data = await response.json();

			// Verify response
			expect(response.status).toBe(404);
			expect(data).toEqual({
				success: false,
				message: "Bookmark not found",
			});
		});

		it("should handle general service errors", async () => {
			// Mock service with error
			const mockService: BookmarkService = {
				getUnreadBookmarks: vi.fn(),
				getUnreadBookmarksCount: vi.fn(),
				markBookmarkAsRead: vi
					.fn()
					.mockRejectedValue(new Error("General error")),
				createBookmarksFromData: vi.fn(),
			};

			// Create router with mock service
			const router = createBookmarksRouter(mockService);

			// Mock request
			const request = new Request("http://localhost/123/read", {
				method: "PATCH",
			});
			const context: HonoContext = {
				req: { path: "/123/read" },
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
				message: "Failed to mark bookmark as read",
			});
		});
	});
});
