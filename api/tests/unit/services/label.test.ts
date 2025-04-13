import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bookmark, Label } from "../../../src/db/schema";
import type { IArticleLabelRepository } from "../../../src/interfaces/repository/articleLabel";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";
import type { BookmarkWithLabel } from "../../../src/interfaces/repository/bookmark";
import type { ILabelRepository } from "../../../src/interfaces/repository/label";
import { LabelService } from "../../../src/services/label";

const mockFindAllWithArticleCount = vi.fn();
const mockFindLabelByName = vi.fn();
const mockCreateLabel = vi.fn();
const mockFindByArticleId = vi.fn();
const mockCreateArticleLabel = vi.fn();
const mockFindBookmarkById = vi.fn();

const mockLabelRepository: ILabelRepository = {
	findAllWithArticleCount: mockFindAllWithArticleCount,
	findByName: mockFindLabelByName,
	create: mockCreateLabel,
};

const mockArticleLabelRepository: IArticleLabelRepository = {
	findByArticleId: mockFindByArticleId,
	create: mockCreateArticleLabel,
};

const mockBookmarkRepository: IBookmarkRepository = {
	findById: mockFindBookmarkById,
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
		vi.clearAllMocks();
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
			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue(undefined);
			mockFindLabelByName.mockResolvedValue(existingLabel);

			const result = await labelService.assignLabel(articleId, labelNameInput);

			expect(result).toEqual(existingLabel);
			expect(mockFindBookmarkById).toHaveBeenCalledWith(articleId);
			expect(mockFindByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockFindLabelByName).toHaveBeenCalledWith(normalizedLabelName);
			expect(mockCreateLabel).not.toHaveBeenCalled();
			expect(mockCreateArticleLabel).toHaveBeenCalledWith({
				articleId: articleId,
				labelId: existingLabel.id,
			});
		});

		it("新しいラベルを作成して記事に付与できること", async () => {
			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue(undefined);
			mockFindLabelByName.mockResolvedValue(undefined);
			mockCreateLabel.mockResolvedValue(newLabel);

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

		it("同じ記事に複数のラベルを付与できること", async () => {
			// 最初のラベル付与のモック設定
			const firstLabel: Label = {
				id: 10,
				name: "typescript",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			
			// 2つ目のラベル付与のモック設定
			const secondLabel: Label = {
				id: 11,
				name: "frontend",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			// 既存のラベルが存在する状態をモック
			mockFindByArticleId.mockResolvedValue({
				id: 1,
				articleId: articleId,
				labelId: firstLabel.id,
				createdAt: new Date(),
			});
			mockFindLabelByName.mockResolvedValue(secondLabel);

			const result = await labelService.assignLabel(articleId, "frontend");

			expect(result).toEqual(secondLabel);
			expect(mockCreateArticleLabel).toHaveBeenCalledWith({
				articleId: articleId,
				labelId: secondLabel.id,
			});
		});

		it("同じラベルを同じ記事に重複して付与できないこと", async () => {
			const existingLabel: Label = {
				id: 10,
				name: "typescript",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockFindBookmarkById.mockResolvedValue(mockBookmark);
			mockFindByArticleId.mockResolvedValue({
				id: 1,
				articleId: articleId,
				labelId: existingLabel.id,
				createdAt: new Date(),
			});
			mockFindLabelByName.mockResolvedValue(existingLabel);

			await expect(
				labelService.assignLabel(articleId, "typescript")
			).rejects.toThrow(`Label "typescript" is already assigned to article ${articleId}`);

			expect(mockCreateArticleLabel).not.toHaveBeenCalled();
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
