import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	// リポジトリのモック
	const mockCreateMany = vi.fn().mockImplementation(() => Promise.resolve());
	const mockFindUnread = vi.fn().mockImplementation(() => Promise.resolve([]));
	const mockMarkAsRead = vi
		.fn()
		.mockImplementation(() => Promise.resolve(true));
	const mockRepository: BookmarkRepository = {
		createMany: mockCreateMany,
		findUnread: mockFindUnread,
		markAsRead: mockMarkAsRead,
	};

	const service = new DefaultBookmarkService(mockRepository);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUnreadBookmarks", () => {
		it("should return unread bookmarks successfully", async () => {
			const expectedBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "Example",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			mockFindUnread.mockResolvedValueOnce(expectedBookmarks);

			const result = await service.getUnreadBookmarks();

			expect(result).toEqual(expectedBookmarks);
			expect(mockRepository.findUnread).toHaveBeenCalled();
		});

		it("should handle repository errors", async () => {
			const error = new Error("Database error");
			mockFindUnread.mockRejectedValueOnce(error);

			await expect(service.getUnreadBookmarks()).rejects.toThrow(error);
		});
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

		describe("markBookmarkAsRead", () => {
			it("should mark a bookmark as read successfully", async () => {
				const bookmarkId = 1;
				mockMarkAsRead.mockResolvedValueOnce(true);

				await service.markBookmarkAsRead(bookmarkId);

				expect(mockRepository.markAsRead).toHaveBeenCalledWith(bookmarkId);
			});

			it("should throw an error when bookmark does not exist", async () => {
				const bookmarkId = 999;
				mockMarkAsRead.mockResolvedValueOnce(false);

				await expect(service.markBookmarkAsRead(bookmarkId)).rejects.toThrow(
					"Bookmark not found",
				);

				expect(mockRepository.markAsRead).toHaveBeenCalledWith(bookmarkId);
			});

			it("should handle repository errors", async () => {
				const bookmarkId = 1;
				const error = new Error("Database error");
				mockMarkAsRead.mockRejectedValueOnce(error);

				await expect(service.markBookmarkAsRead(bookmarkId)).rejects.toThrow(
					error,
				);
				expect(mockRepository.markAsRead).toHaveBeenCalledWith(bookmarkId);
			});
		});
	});
});
