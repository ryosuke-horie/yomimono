import { describe, expect, it, vi } from "vitest";
import { SummaryService } from "../../../src/services/summary";
describe("DefaultSummaryService", () => {
	let mockBookmarkRepository;
	let summaryService;
	const mockBookmark = {
		id: 1,
		url: "https://example.com",
		title: "Example Article",
		isRead: false,
		summary: null,
		summaryCreatedAt: null,
		summaryUpdatedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockBookmarkWithLabel = {
		...mockBookmark,
		isFavorite: false,
		label: null,
	};
	const mockBookmarksWithoutSummary = [
		mockBookmark,
		{
			id: 2,
			url: "https://example2.com",
			title: "Example Article 2",
			isRead: false,
			summary: null,
			summaryCreatedAt: null,
			summaryUpdatedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];
	beforeEach(() => {
		mockBookmarkRepository = {
			createMany: vi.fn(),
			findUnread: vi.fn(),
			findByUrls: vi.fn(),
			markAsRead: vi.fn(),
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
			findWithoutSummary: vi.fn(),
			updateSummary: vi.fn(),
		};
		summaryService = new SummaryService(mockBookmarkRepository);
	});
	describe("getBookmarksWithoutSummary：要約なしブックマークの取得", () => {
		it("正常に要約なしブックマークのリストを返すこと", async () => {
			vi.mocked(mockBookmarkRepository.findWithoutSummary).mockResolvedValue(
				mockBookmarksWithoutSummary,
			);
			const result = await summaryService.getBookmarksWithoutSummary();
			expect(result).toEqual(
				mockBookmarksWithoutSummary.map((bookmark) => ({
					id: bookmark.id,
					url: bookmark.url,
					title: bookmark.title,
					isRead: bookmark.isRead,
					createdAt: bookmark.createdAt,
					updatedAt: bookmark.updatedAt,
				})),
			);
			expect(mockBookmarkRepository.findWithoutSummary).toHaveBeenCalledWith(
				10,
				"createdAt",
			);
		});
		it("ページネーションオプションを正しく伝達すること", async () => {
			vi.mocked(mockBookmarkRepository.findWithoutSummary).mockResolvedValue(
				[],
			);
			await summaryService.getBookmarksWithoutSummary(50, "readAt");
			expect(mockBookmarkRepository.findWithoutSummary).toHaveBeenCalledWith(
				50,
				"readAt",
			);
		});
		it("リポジトリのエラーを適切に伝播すること", async () => {
			const mockError = new Error("Database error");
			vi.mocked(mockBookmarkRepository.findWithoutSummary).mockRejectedValue(
				mockError,
			);
			await expect(summaryService.getBookmarksWithoutSummary()).rejects.toThrow(
				"Database error",
			);
		});
	});
	describe("getBookmarkById：IDによるブックマーク取得", () => {
		it("正常にブックマークを返すこと", async () => {
			vi.mocked(mockBookmarkRepository.findById).mockResolvedValue(
				mockBookmarkWithLabel,
			);
			const result = await summaryService.getBookmarkById(1);
			expect(result).toEqual({
				id: mockBookmark.id,
				url: mockBookmark.url,
				title: mockBookmark.title,
				isRead: mockBookmark.isRead,
				summary: mockBookmark.summary,
				summaryCreatedAt: mockBookmark.summaryCreatedAt,
				summaryUpdatedAt: mockBookmark.summaryUpdatedAt,
				createdAt: mockBookmark.createdAt,
				updatedAt: mockBookmark.updatedAt,
			});
			expect(mockBookmarkRepository.findById).toHaveBeenCalledWith(1);
		});
		it("ブックマークが見つからない場合は例外を投げること", async () => {
			vi.mocked(mockBookmarkRepository.findById).mockResolvedValue(undefined);
			await expect(summaryService.getBookmarkById(999)).rejects.toThrow(
				"Bookmark not found",
			);
		});
		it("リポジトリのエラーを適切に伝播すること", async () => {
			const mockError = new Error("Database error");
			vi.mocked(mockBookmarkRepository.findById).mockRejectedValue(mockError);
			await expect(summaryService.getBookmarkById(1)).rejects.toThrow(
				"Database error",
			);
		});
	});
	describe("saveSummary：要約の保存", () => {
		it("正常に要約を保存できること", async () => {
			const request = {
				bookmarkId: 1,
				summary: "これは記事の要約です",
			};
			const updatedBookmark = {
				...mockBookmarkWithLabel,
				summary: request.summary,
				summaryCreatedAt: new Date(),
				summaryUpdatedAt: new Date(),
			};
			vi.mocked(mockBookmarkRepository.updateSummary).mockResolvedValue(
				updatedBookmark,
			);
			const result = await summaryService.saveSummary(request);
			expect(result).toEqual({
				id: updatedBookmark.id,
				url: updatedBookmark.url,
				title: updatedBookmark.title,
				isRead: updatedBookmark.isRead,
				summary: updatedBookmark.summary,
				summaryCreatedAt: updatedBookmark.summaryCreatedAt,
				summaryUpdatedAt: updatedBookmark.summaryUpdatedAt,
				createdAt: updatedBookmark.createdAt,
				updatedAt: updatedBookmark.updatedAt,
			});
			expect(mockBookmarkRepository.updateSummary).toHaveBeenCalledWith(
				request.bookmarkId,
				request.summary,
			);
		});
		it("ブックマークが見つからない場合は例外を投げること", async () => {
			const request = {
				bookmarkId: 999,
				summary: "要約",
			};
			vi.mocked(mockBookmarkRepository.updateSummary).mockResolvedValue(
				undefined,
			);
			await expect(summaryService.saveSummary(request)).rejects.toThrow(
				"Bookmark not found: 999",
			);
		});
	});
	describe("updateSummary：要約の更新", () => {
		it("正常に要約を更新できること", async () => {
			const request = {
				bookmarkId: 1,
				summary: "更新された要約",
			};
			const existingSummaryBookmark = {
				...mockBookmarkWithLabel,
				summary: "既存の要約",
				summaryCreatedAt: new Date("2024-01-01"),
				summaryUpdatedAt: new Date("2024-01-01"),
			};
			const updatedSummary = {
				...existingSummaryBookmark,
				summary: request.summary,
				summaryUpdatedAt: new Date(),
			};
			vi.mocked(mockBookmarkRepository.updateSummary).mockResolvedValue(
				updatedSummary,
			);
			const result = await summaryService.updateSummary(request);
			expect(result).toEqual({
				id: updatedSummary.id,
				url: updatedSummary.url,
				title: updatedSummary.title,
				isRead: updatedSummary.isRead,
				summary: updatedSummary.summary,
				summaryCreatedAt: updatedSummary.summaryCreatedAt,
				summaryUpdatedAt: updatedSummary.summaryUpdatedAt,
				createdAt: updatedSummary.createdAt,
				updatedAt: updatedSummary.updatedAt,
			});
			expect(mockBookmarkRepository.updateSummary).toHaveBeenCalledWith(
				request.bookmarkId,
				request.summary,
			);
		});
		it("ブックマークが見つからない場合は例外を投げること", async () => {
			const request = {
				bookmarkId: 999,
				summary: "要約",
			};
			vi.mocked(mockBookmarkRepository.updateSummary).mockResolvedValue(
				undefined,
			);
			await expect(summaryService.updateSummary(request)).rejects.toThrow(
				"Bookmark not found: 999",
			);
		});
	});
});
