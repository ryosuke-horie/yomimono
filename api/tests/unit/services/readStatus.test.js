import { beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultBookmarkService } from "../../../src/services/bookmark";
vi.mock("../../../src/repositories/bookmark");
describe("Bookmark Service - Read Status", () => {
	let bookmarkService;
	let mockRepository;
	beforeEach(() => {
		vi.clearAllMocks();
		mockRepository = {
			findRead: vi.fn(),
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
			mockRepository.findRead.mockResolvedValue(mockReadBookmarks);
			const result = await bookmarkService.getReadBookmarks();
			expect(result).toEqual(mockReadBookmarks);
			expect(mockRepository.findRead).toHaveBeenCalledOnce();
		});
		it("リポジトリからエラーが発生した場合エラーをスロー", async () => {
			mockRepository.findRead.mockRejectedValue(
				new Error("Database connection error"),
			);
			await expect(bookmarkService.getReadBookmarks()).rejects.toThrow(
				"Failed to get read bookmarks",
			);
		});
	});
});
