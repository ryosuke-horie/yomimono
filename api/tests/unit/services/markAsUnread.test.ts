import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("markBookmarkAsUnread", () => {
	let service: DefaultBookmarkService;
	const mockMarkAsUnread = vi.fn();

	const mockRepository: IBookmarkRepository = {
		findUnread: vi.fn(),
		findByUrls: vi.fn(),
		markAsRead: vi.fn(),
		markAsUnread: mockMarkAsUnread,
		countUnread: vi.fn(),
		countTodayRead: vi.fn(),
		createMany: vi.fn(),
		addToFavorites: vi.fn(),
		removeFromFavorites: vi.fn(),
		getFavoriteBookmarks: vi.fn(),
		isFavorite: vi.fn(),
		findRecentlyRead: vi.fn(),
		findRead: vi.fn(),
		findUnlabeled: vi.fn(),
		findByLabelName: vi.fn(),
		findById: vi.fn(),
		findByIds: vi.fn(),
		findWithoutSummary: vi.fn(),
		updateSummary: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		service = new DefaultBookmarkService(mockRepository);
	});

	it("ブックマークを未読に戻せること", async () => {
		mockMarkAsUnread.mockResolvedValue(true);
		
		await service.markBookmarkAsUnread(1);
		
		expect(mockMarkAsUnread).toHaveBeenCalledWith(1);
	});

	it("存在しないブックマークの場合はエラーをスローすること", async () => {
		mockMarkAsUnread.mockResolvedValue(false);
		
		await expect(service.markBookmarkAsUnread(999)).rejects.toThrow(
			"Bookmark not found"
		);
		expect(mockMarkAsUnread).toHaveBeenCalledWith(999);
	});

	it("リポジトリでエラーが発生した場合はエラーを伝播すること", async () => {
		const error = new Error("Repository error");
		mockMarkAsUnread.mockRejectedValue(error);
		
		await expect(service.markBookmarkAsUnread(1)).rejects.toThrow(error);
	});
});