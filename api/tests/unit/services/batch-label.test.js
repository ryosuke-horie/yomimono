import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabelService } from "../../../src/services/label";
describe("LabelService - 一括ラベル付け機能", () => {
	let labelService;
	let labelRepository;
	let articleLabelRepository;
	let bookmarkRepository;
	beforeEach(() => {
		labelRepository = {
			findByName: vi.fn(),
			create: vi.fn(),
			findById: vi.fn(),
			deleteById: vi.fn(),
			updateDescription: vi.fn(),
			findAllWithArticleCount: vi.fn(),
		};
		articleLabelRepository = {
			findByArticleId: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			findExistingArticleIds: vi.fn(),
		};
		bookmarkRepository = {
			findById: vi.fn(),
			findByIds: vi.fn(),
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
		};
		labelService = new LabelService(
			labelRepository,
			articleLabelRepository,
			bookmarkRepository,
		);
	});
	describe("assignLabelsToMultipleArticles", () => {
		const mockLabel = {
			id: 1,
			name: "javascript",
			description: "JavaScript関連記事",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const mockBookmark1 = {
			id: 1,
			url: "https://example.com/1",
			title: "Test Article 1",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			isFavorite: false,
			isRead: false,
			label: null,
		};
		const mockBookmark2 = {
			id: 2,
			url: "https://example.com/2",
			title: "Test Article 2",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			isFavorite: false,
			isRead: false,
			label: null,
		};
		describe("正常系", () => {
			it("新規ラベルで複数の記事にラベルを付与できる", async () => {
				vi.mocked(labelRepository.findByName).mockResolvedValue(null);
				vi.mocked(labelRepository.create).mockResolvedValue(mockLabel);
				vi.mocked(bookmarkRepository.findByIds).mockResolvedValue(
					new Map([
						[1, mockBookmark1],
						[2, mockBookmark2],
					]),
				);
				vi.mocked(
					articleLabelRepository.findExistingArticleIds,
				).mockResolvedValue(new Set());
				vi.mocked(articleLabelRepository.createMany).mockResolvedValue([
					{ id: 1, articleId: 1, labelId: 1, createdAt: new Date() },
					{ id: 2, articleId: 2, labelId: 1, createdAt: new Date() },
				]);
				const result = await labelService.assignLabelsToMultipleArticles(
					[1, 2],
					"JavaScript",
					"JavaScript関連記事",
				);
				expect(result).toEqual({
					successful: 2,
					skipped: 0,
					errors: [],
					label: mockLabel,
				});
				expect(labelRepository.findByName).toHaveBeenCalledWith("javascript");
				expect(labelRepository.create).toHaveBeenCalledWith({
					name: "javascript",
					description: "JavaScript関連記事",
				});
			});
			it("既存のラベルで複数の記事にラベルを付与できる", async () => {
				vi.mocked(labelRepository.findByName).mockResolvedValue(mockLabel);
				vi.mocked(bookmarkRepository.findByIds).mockResolvedValue(
					new Map([
						[1, mockBookmark1],
						[2, mockBookmark2],
					]),
				);
				vi.mocked(
					articleLabelRepository.findExistingArticleIds,
				).mockResolvedValue(new Set());
				vi.mocked(articleLabelRepository.createMany).mockResolvedValue([
					{ id: 1, articleId: 1, labelId: 1, createdAt: new Date() },
					{ id: 2, articleId: 2, labelId: 1, createdAt: new Date() },
				]);
				const result = await labelService.assignLabelsToMultipleArticles(
					[1, 2],
					"JavaScript",
				);
				expect(result).toEqual({
					successful: 2,
					skipped: 0,
					errors: [],
					label: mockLabel,
				});
				expect(labelRepository.create).not.toHaveBeenCalled();
			});
			it("既にラベル付けされている記事はスキップする", async () => {
				vi.mocked(labelRepository.findByName).mockResolvedValue(mockLabel);
				vi.mocked(bookmarkRepository.findByIds).mockResolvedValue(
					new Map([
						[1, mockBookmark1],
						[2, mockBookmark2],
					]),
				);
				vi.mocked(
					articleLabelRepository.findExistingArticleIds,
				).mockResolvedValue(new Set([2]));
				vi.mocked(articleLabelRepository.createMany).mockResolvedValue([
					{ id: 1, articleId: 1, labelId: 1, createdAt: new Date() },
				]);
				const result = await labelService.assignLabelsToMultipleArticles(
					[1, 2],
					"JavaScript",
				);
				expect(result).toEqual({
					successful: 1,
					skipped: 1,
					errors: [],
					label: mockLabel,
				});
				expect(articleLabelRepository.createMany).toHaveBeenCalledWith([
					{ articleId: 1, labelId: 1 },
				]);
			});
		});
		describe("異常系", () => {
			it("存在しない記事IDはエラーとして記録される", async () => {
				vi.mocked(labelRepository.findByName).mockResolvedValue(mockLabel);
				vi.mocked(bookmarkRepository.findByIds).mockResolvedValue(
					new Map([[1, mockBookmark1]]),
				);
				vi.mocked(
					articleLabelRepository.findExistingArticleIds,
				).mockResolvedValue(new Set());
				vi.mocked(articleLabelRepository.createMany).mockResolvedValue([
					{ id: 1, articleId: 1, labelId: 1, createdAt: new Date() },
				]);
				const result = await labelService.assignLabelsToMultipleArticles(
					[1, 2],
					"JavaScript",
				);
				expect(result).toEqual({
					successful: 1,
					skipped: 0,
					errors: [{ articleId: 2, error: "Bookmark with id 2 not found" }],
					label: mockLabel,
				});
			});
			it("空のラベル名はエラーになる", async () => {
				await expect(
					labelService.assignLabelsToMultipleArticles([1, 2], "   "),
				).rejects.toThrow("Label name cannot be empty after normalization");
			});
			it("DBエラー時は全てエラーとして記録される", async () => {
				vi.mocked(labelRepository.findByName).mockResolvedValue(mockLabel);
				vi.mocked(bookmarkRepository.findByIds).mockResolvedValue(
					new Map([
						[1, mockBookmark1],
						[2, mockBookmark2],
					]),
				);
				vi.mocked(
					articleLabelRepository.findExistingArticleIds,
				).mockResolvedValue(new Set());
				vi.mocked(articleLabelRepository.createMany).mockRejectedValue(
					new Error("Database error"),
				);
				const result = await labelService.assignLabelsToMultipleArticles(
					[1, 2],
					"JavaScript",
				);
				expect(result).toEqual({
					successful: 0,
					skipped: 0,
					errors: [
						{ articleId: 1, error: "Database error" },
						{ articleId: 2, error: "Database error" },
					],
					label: mockLabel,
				});
			});
		});
	});
});
