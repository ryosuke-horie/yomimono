import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bookmark, Label } from "../../../src/db/schema";
import type { IArticleLabelRepository } from "../../../src/interfaces/repository/articleLabel";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";
import type { BookmarkWithLabel } from "../../../src/interfaces/repository/bookmark";
import type { ILabelRepository } from "../../../src/interfaces/repository/label";
import { LabelService } from "../../../src/services/label";

// --- Mock Repository Methods ---
const mockFindAllWithArticleCount = vi.fn();
const mockFindLabelByName = vi.fn();
const mockCreateLabel = vi.fn();
const mockFindByArticleId = vi.fn();
const mockCreateArticleLabel = vi.fn();
const mockFindBookmarkById = vi.fn();
// --- End Mock Repository Methods ---

// Mock Repositories using mocked methods
const mockLabelRepository: ILabelRepository = {
	findAllWithArticleCount: mockFindAllWithArticleCount,
	findByName: mockFindLabelByName,
	create: mockCreateLabel,
};

const mockArticleLabelRepository: IArticleLabelRepository = {
	findByArticleId: mockFindByArticleId,
	create: mockCreateArticleLabel,
};

// BookmarkRepositoryのモックも必要 (LabelServiceで使うのはfindByIdのみ)
const mockBookmarkRepository: IBookmarkRepository = {
	findById: mockFindBookmarkById,
	// Fill other methods with vi.fn() to satisfy the type, though they won't be called in these tests
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

describe("LabelService", () => {
	let labelService: LabelService;

	beforeEach(() => {
		// Clear mocks on the functions themselves
		vi.clearAllMocks();
		// Recreate service instance
		labelService = new LabelService(
			mockLabelRepository,
			mockArticleLabelRepository,
			mockBookmarkRepository,
		);
	});

	describe("getLabels", () => {
		it("全てのラベルと記事数を取得できること", async () => {
			const mockLabelsWithCount = [
				{
					id: 1,
					name: "go",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 5,
				},
				{
					id: 2,
					name: "typescript",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 10,
				},
			];
			// Use the specific mock function instance
			mockFindAllWithArticleCount.mockResolvedValue(mockLabelsWithCount);

			const result = await labelService.getLabels();

			expect(result).toEqual(mockLabelsWithCount);
			expect(mockFindAllWithArticleCount).toHaveBeenCalledOnce();
		});
	});

	describe("assignLabel", () => {
		const articleId = 1;
		const labelNameInput = " TypeScript "; // Test normalization
		const normalizedLabelName = "typescript";
		const mockBookmark: BookmarkWithLabel = {
			id: articleId,
			url: "url",
			title: "title",
			isRead: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			isFavorite: false,
			label: null,
		};
		const existingLabel: Label = {
			id: 10,
			name: normalizedLabelName,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const newLabel: Label = {
			id: 11,
			name: normalizedLabelName,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it("既存のラベルを記事に付与できること", async () => {
			// Use the specific mock function instances
			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue(undefined); // Not labeled yet
			mockFindLabelByName.mockResolvedValue(existingLabel); // Label exists

			const result = await labelService.assignLabel(articleId, labelNameInput);

			expect(result).toEqual(existingLabel);
			expect(mockFindBookmarkById).toHaveBeenCalledWith(articleId);
			expect(mockFindByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockFindLabelByName).toHaveBeenCalledWith(normalizedLabelName);
			expect(mockCreateLabel).not.toHaveBeenCalled(); // Check the specific mock
			expect(mockCreateArticleLabel).toHaveBeenCalledWith({
				// Check the specific mock
				articleId: articleId,
				labelId: existingLabel.id,
			});
		});

		it("新しいラベルを作成して記事に付与できること", async () => {
			// Use the specific mock function instances
			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue(undefined); // Not labeled yet
			mockFindLabelByName.mockResolvedValue(undefined); // Label does not exist
			mockCreateLabel.mockResolvedValue(newLabel); // Mock creation

			const result = await labelService.assignLabel(articleId, labelNameInput);

			expect(result).toEqual(newLabel);
			expect(mockFindBookmarkById).toHaveBeenCalledWith(articleId);
			expect(mockFindByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockFindLabelByName).toHaveBeenCalledWith(normalizedLabelName);
			expect(mockCreateLabel).toHaveBeenCalledWith({
				name: normalizedLabelName,
			});
			expect(mockCreateArticleLabel).toHaveBeenCalledWith({
				articleId: articleId,
				labelId: newLabel.id,
			});
		});

		it("存在しない記事IDの場合エラーをスローすること", async () => {
			// Use the specific mock function instance
			mockFindBookmarkById.mockResolvedValue(undefined); // Bookmark not found

			await expect(
				labelService.assignLabel(999, labelNameInput),
			).rejects.toThrow("Bookmark with id 999 not found");

			expect(mockFindByArticleId).not.toHaveBeenCalled();
			expect(mockFindLabelByName).not.toHaveBeenCalled();
		});

		it("既にラベルが付与されている記事の場合エラーをスローすること", async () => {
			// Use the specific mock function instances
			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue({
				id: 1,
				articleId: articleId,
				labelId: 10,
				createdAt: new Date(),
			}); // Already labeled

			await expect(
				labelService.assignLabel(articleId, labelNameInput),
			).rejects.toThrow(`Article ${articleId} is already labeled`);

			expect(mockFindLabelByName).not.toHaveBeenCalled();
			expect(mockCreateArticleLabel).not.toHaveBeenCalled();
		});

		it("正規化後にラベル名が空になる場合エラーをスローすること", async () => {
			// Use the specific mock function instances
			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue(undefined);

			await expect(labelService.assignLabel(articleId, "  ")) // Empty after trim
				.rejects.toThrow("Label name cannot be empty after normalization");

			expect(mockFindLabelByName).not.toHaveBeenCalled();
			expect(mockCreateArticleLabel).not.toHaveBeenCalled();
		});
	});
});
