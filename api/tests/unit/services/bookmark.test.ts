import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	// グローバルfetchのモック
	const mockFetch = vi.fn();
	global.fetch = mockFetch;

	// リポジトリのモック
	const mockRepository: BookmarkRepository = {
		createMany: vi.fn(),
	};

	const service = new DefaultBookmarkService(mockRepository);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("createBookmarksFromUrls", () => {
		it("should create bookmarks with titles successfully", async () => {
			const urls = ["https://example.com", "https://example.org"];

			// fetchのレスポンスをモック
			mockFetch
				.mockResolvedValueOnce({
					text: () => Promise.resolve("<title>Example Title</title>"),
				})
				.mockResolvedValueOnce({
					text: () => Promise.resolve("<title>Example Org</title>"),
				});

			await service.createBookmarksFromUrls(urls);

			// リポジトリの呼び出しを検証
			expect(mockRepository.createMany).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						url: "https://example.com",
						title: "Example Title",
						isRead: false,
					}),
					expect.objectContaining({
						url: "https://example.org",
						title: "Example Org",
						isRead: false,
					}),
				]),
			);
		});

		it("should handle URLs without titles", async () => {
			const urls = ["https://example.com"];

			mockFetch.mockResolvedValueOnce({
				text: () => Promise.resolve("<html>No title</html>"),
			});

			await service.createBookmarksFromUrls(urls);

			expect(mockRepository.createMany).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						url: "https://example.com",
						title: null,
						isRead: false,
					}),
				]),
			);
		});

		it("should handle fetch errors", async () => {
			const urls = ["https://example.com"];

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await service.createBookmarksFromUrls(urls);

			expect(mockRepository.createMany).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						url: "https://example.com",
						title: null,
						isRead: false,
					}),
				]),
			);
		});

		it("should handle repository errors", async () => {
			const urls = ["https://example.com"];
			const error = new Error("Database error");

			mockFetch.mockResolvedValueOnce({
				text: () => Promise.resolve("<title>Example Title</title>"),
			});

			mockRepository.createMany.mockRejectedValueOnce(error);

			await expect(service.createBookmarksFromUrls(urls)).rejects.toThrow(
				error,
			);
		});
	});
});
