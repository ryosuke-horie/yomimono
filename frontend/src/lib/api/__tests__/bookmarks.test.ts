import { beforeEach, describe, expect, it, vi } from "vitest";
import { markBookmarkAsRead } from "../bookmarks";

describe("bookmarks API client", () => {
	describe("markBookmarkAsRead", () => {
		const mockFetch = vi.fn();
		global.fetch = mockFetch;

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("正常に既読にできる", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true }),
			};
			mockFetch.mockResolvedValueOnce(mockResponse);

			await expect(markBookmarkAsRead(1)).resolves.not.toThrow();

			expect(mockFetch).toHaveBeenCalledWith("/api/bookmarks/1/read", {
				method: "PATCH",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});
		});

		it("APIがエラーを返した場合、エラーをスローする", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: false, message: "API error" }),
			};
			mockFetch.mockResolvedValueOnce(mockResponse);

			await expect(markBookmarkAsRead(1)).rejects.toThrow("API error");
		});

		it("HTTPエラーの場合、エラーをスローする", async () => {
			const mockResponse = {
				ok: false,
				status: 500,
			};
			mockFetch.mockResolvedValueOnce(mockResponse);

			await expect(markBookmarkAsRead(1)).rejects.toThrow(
				"HTTP error! status: 500",
			);
		});

		it("ネットワークエラーの場合、エラーをスローする", async () => {
			const networkError = new Error("Network error");
			mockFetch.mockRejectedValueOnce(networkError);

			await expect(markBookmarkAsRead(1)).rejects.toThrow("Network error");
		});
	});
});
