import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";
import type { BookmarkService } from "../../../src/services/bookmark";

describe("Bookmarks Router", () => {
	const mockCreateBookmarksFromData = vi
		.fn()
		.mockImplementation(() => Promise.resolve());
	const router = createBookmarksRouter({
		createBookmarksFromData: mockCreateBookmarksFromData,
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /bulk", () => {
		it("should create bookmarks successfully", async () => {
			const bookmarks = [
				{ url: "https://example.com", title: "Example" },
				{ url: "https://example.org", title: "Example Org" },
			];
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks }),
			});

			mockCreateBookmarksFromData.mockResolvedValue(undefined);

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json).toEqual({ success: true });
			expect(mockCreateBookmarksFromData).toHaveBeenCalledWith(bookmarks);
		});

		it("should handle invalid request body", async () => {
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks: "not an array" }),
			});

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json).toEqual({
				success: false,
				message: "bookmarks must be an array",
			});
			expect(mockCreateBookmarksFromData).not.toHaveBeenCalled();
		});

		it("should handle empty bookmarks array", async () => {
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks: [] }),
			});

			const res = await router.fetch(req);
			const json = await res.json();

			expect(res.status).toBe(400);
			expect(json).toEqual({
				success: false,
				message: "bookmarks must contain 1-10 items",
			});
			expect(mockCreateBookmarksFromData).not.toHaveBeenCalled();
		});

		it("should handle service errors", async () => {
			const bookmarks = [{ url: "https://example.com", title: "Example" }];
			const req = new Request("http://localhost/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bookmarks }),
			});

			mockCreateBookmarksFromData.mockRejectedValue(new Error("Service error"));

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
