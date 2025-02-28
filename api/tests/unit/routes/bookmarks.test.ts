import { describe, expect, it, vi } from "vitest";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";
import type { BookmarkService } from "../../../src/services/bookmark";

describe("Bookmarks Router", () => {
	// サービスのモック
	const mockBookmarkService: BookmarkService = {
		createBookmarksFromUrls: vi.fn(),
	};

	const router = createBookmarksRouter(mockBookmarkService);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /bulk", () => {
		it("should create bookmarks successfully", async () => {
			const urls = ["https://example.com", "https://example.org"];
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ urls }),
			});

			mockBookmarkService.createBookmarksFromUrls.mockResolvedValueOnce(
				undefined,
			);

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json).toEqual({ success: true });
			expect(mockBookmarkService.createBookmarksFromUrls).toHaveBeenCalledWith(
				urls,
			);
		});

		it("should handle invalid request body", async () => {
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ urls: "not an array" }),
			});

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json).toEqual({
				success: false,
				message: "urls must be an array",
			});
			expect(
				mockBookmarkService.createBookmarksFromUrls,
			).not.toHaveBeenCalled();
		});

		it("should handle empty urls array", async () => {
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ urls: [] }),
			});

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json).toEqual({
				success: false,
				message: "urls must contain 1-10 items",
			});
			expect(
				mockBookmarkService.createBookmarksFromUrls,
			).not.toHaveBeenCalled();
		});

		it("should handle service errors", async () => {
			const urls = ["https://example.com"];
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ urls }),
			});

			mockBookmarkService.createBookmarksFromUrls.mockRejectedValueOnce(
				new Error("Service error"),
			);

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(500);
			expect(json).toEqual({
				success: false,
				message: "Failed to create bookmarks",
			});
		});
	});
});
