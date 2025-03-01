import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	// リポジトリのモック
	const mockCreateMany = vi.fn().mockImplementation(() => Promise.resolve());
	const mockRepository: BookmarkRepository = {
		createMany: mockCreateMany,
	};

	const service = new DefaultBookmarkService(mockRepository);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("createBookmarksFromData", () => {
		it("should create bookmarks successfully", async () => {
			const bookmarks = [
				{ url: "https://example.com", title: "Example Title" },
				{ url: "https://example.org", title: "Example Org" },
			];

			await service.createBookmarksFromData(bookmarks);

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

		it("should handle bookmarks without titles", async () => {
			const bookmarks = [{ url: "https://example.com", title: "" }];

			await service.createBookmarksFromData(bookmarks);

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
			const bookmarks = [
				{ url: "https://example.com", title: "Example Title" },
			];
			const error = new Error("Database error");

			mockCreateMany.mockImplementationOnce(() => Promise.reject(error));

			await expect(service.createBookmarksFromData(bookmarks)).rejects.toThrow(
				error,
			);
		});
	});
});
