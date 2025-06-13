import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("Bookmark Service - Read Status", () => {
	let bookmarkService: DefaultBookmarkService;
	let mockRepository: IBookmarkRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		mockRepository = {
			findRead: vi.fn(),
			createMany: vi.fn(),
			findUnread: vi.fn(),
			findByUrls: vi.fn(),
			markAsRead: vi.fn(),
			markAsUnread: vi.fn(),
			countUnread: vi.fn(),
			countTodayRead: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			isFavorite: vi.fn(),
			findRecentlyRead: vi.fn(),
			findUnlabeled: vi.fn(),
			findByLabelName: vi.fn(),
			findById: vi.fn(),
			findByIds: vi.fn(),
			findUnrated: vi.fn(),
		};
		bookmarkService = new DefaultBookmarkService(mockRepository);
	});

	describe("getReadBookmarks", () => {
		it("既読のブックマークをリポジトリから取得できる", async () => {
			const mockReadBookmarks = [
				{
					id: 1,
					url: "https://example.com/article1",
					title: "既読記事1",
					isFavorite: false,
					isRead: true,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-10"),
					label: null,
				},
			];

			vi.mocked(mockRepository.findRead).mockResolvedValue(mockReadBookmarks);

			const result = await bookmarkService.getReadBookmarks();

			expect(result).toEqual(mockReadBookmarks);
			expect(vi.mocked(mockRepository.findRead)).toHaveBeenCalledOnce();
		});

		it("リポジトリからエラーが発生した場合エラーをスロー", async () => {
			vi.mocked(mockRepository.findRead).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(bookmarkService.getReadBookmarks()).rejects.toThrow(
				"Failed to get read bookmarks",
			);
		});
	});
});
