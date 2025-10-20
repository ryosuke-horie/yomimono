import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../../../src/db/schema";
import type { IArticleLabelRepository } from "../../../src/interfaces/repository/articleLabel";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../../../src/interfaces/repository/bookmark";
import type { ILabelRepository } from "../../../src/interfaces/repository/label";
import { LabelService } from "../../../src/services/label";

const mockFindAllWithArticleCount = vi.fn();
const mockFindLabelByName = vi.fn();
const mockFindLabelById = vi.fn();
const mockUpdateDescription = vi.fn();
const mockCreateLabel = vi.fn();
const mockDeleteById = vi.fn();
const mockDeleteMany = vi.fn();
const mockFindByArticleId = vi.fn();
const mockCreateArticleLabel = vi.fn();
const mockFindBookmarkById = vi.fn();

const mockLabelRepository: ILabelRepository = {
	findAllWithArticleCount: mockFindAllWithArticleCount,
	findByName: mockFindLabelByName,
	findById: mockFindLabelById,
	create: mockCreateLabel,
	deleteById: mockDeleteById,
	updateDescription: mockUpdateDescription,
	deleteMany: mockDeleteMany,
};

const mockArticleLabelRepository: IArticleLabelRepository = {
	findByArticleId: mockFindByArticleId,
	create: mockCreateArticleLabel,
	createMany: vi.fn(),
	findExistingArticleIds: vi.fn(),
};

const mockBookmarkRepository: IBookmarkRepository = {
	findById: mockFindBookmarkById,
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
	findByIds: vi.fn(),
	findUnrated: vi.fn(),
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
					description: "Go言語に関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 5,
				},
				{
					id: 2,
					name: "typescript",
					description: "TypeScriptに関する記事",
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

	describe("getLabelById", () => {
		const labelId = 1;
		const mockLabel: Label = {
			id: labelId,
			name: "typescript",
			description: "TypeScriptに関する記事",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it("指定されたIDのラベルを取得できること", async () => {
			mockFindLabelById.mockResolvedValue(mockLabel);

			const result = await labelService.getLabelById(labelId);

			expect(result).toEqual(mockLabel);
			expect(mockFindLabelById).toHaveBeenCalledWith(labelId);
		});

		it("存在しないIDの場合エラーをスローすること", async () => {
			mockFindLabelById.mockResolvedValue(undefined);

			await expect(labelService.getLabelById(999)).rejects.toThrow(
				"Label with id 999 not found",
			);
			expect(mockFindLabelById).toHaveBeenCalledWith(999);
		});
	});

	describe("assignLabel", () => {
		const articleId = 1;
		const labelNameInput = " TypeScript "; // Test normalization
		const normalizedLabelName = "typescript";
		const description = "TypeScriptに関する記事";
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
			description,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const newLabel: Label = {
			id: 11,
			name: normalizedLabelName,
			description,
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

			const result = await labelService.assignLabel(
				articleId,
				labelNameInput,
				description,
			);

			expect(result).toEqual(newLabel);
			expect(mockFindBookmarkById).toHaveBeenCalledWith(articleId);
			expect(mockFindByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockFindLabelByName).toHaveBeenCalledWith(normalizedLabelName);
			expect(mockCreateLabel).toHaveBeenCalledWith({
				name: normalizedLabelName,
				description,
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
				description: "TypeScriptに関する記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// 2つ目のラベル付与のモック設定
			const secondLabel: Label = {
				id: 11,
				name: "frontend",
				description: "フロントエンド開発に関する記事",
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
				description: "TypeScriptに関する記事",
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
				labelService.assignLabel(articleId, "typescript"),
			).rejects.toThrow(
				`Label "typescript" is already assigned to article ${articleId}`,
			);

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

	describe("createLabel", () => {
		const labelNameInput = " New Label ";
		const normalizedLabelName = "new label";
		const description = "新しいラベルの説明";
		const newLabel: Label = {
			id: 12,
			name: normalizedLabelName,
			description,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const existingLabel: Label = {
			id: 13,
			name: normalizedLabelName,
			description: "既存ラベルの説明",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it("新しいラベルを作成できること", async () => {
			mockFindLabelByName.mockResolvedValue(undefined); // Label does not exist
			mockCreateLabel.mockResolvedValue(newLabel);

			const result = await labelService.createLabel(
				labelNameInput,
				description,
			);

			expect(result).toEqual(newLabel);
			expect(mockFindLabelByName).toHaveBeenCalledWith(normalizedLabelName);
			expect(mockCreateLabel).toHaveBeenCalledWith({
				name: normalizedLabelName,
				description,
			});
		});

		it("正規化後にラベル名が空になる場合エラーをスローすること", async () => {
			await expect(labelService.createLabel("  ")).rejects.toThrow(
				"Label name cannot be empty after normalization",
			);
			expect(mockFindLabelByName).not.toHaveBeenCalled();
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});

		it("同じ名前（正規化後）のラベルが既に存在する場合エラーをスローすること", async () => {
			mockFindLabelByName.mockResolvedValue(existingLabel); // Label already exists

			await expect(labelService.createLabel(labelNameInput)).rejects.toThrow(
				`Label "${normalizedLabelName}" already exists`,
			);
			expect(mockFindLabelByName).toHaveBeenCalledWith(normalizedLabelName);
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});
	});

	describe("updateLabelDescription", () => {
		const labelId = 1;
		const newDescription = "更新された説明文";
		const label: Label = {
			id: labelId,
			name: "typescript",
			description: "古い説明文",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const updatedLabel: Label = {
			...label,
			description: newDescription,
			updatedAt: new Date(),
		};

		it("ラベルの説明文を更新できること", async () => {
			mockFindLabelById.mockResolvedValue(label);
			mockUpdateDescription.mockResolvedValue(updatedLabel);

			const result = await labelService.updateLabelDescription(
				labelId,
				newDescription,
			);

			expect(result).toEqual(updatedLabel);
			expect(mockFindLabelById).toHaveBeenCalledWith(labelId);
			expect(mockUpdateDescription).toHaveBeenCalledWith(
				labelId,
				newDescription,
			);
		});

		it("nullを指定して説明文を削除できること", async () => {
			const labelWithoutDesc = {
				...label,
				description: null,
				updatedAt: new Date(),
			};
			mockFindLabelById.mockResolvedValue(label);
			mockUpdateDescription.mockResolvedValue(labelWithoutDesc);

			const result = await labelService.updateLabelDescription(labelId, null);

			expect(result).toEqual(labelWithoutDesc);
			expect(mockFindLabelById).toHaveBeenCalledWith(labelId);
			expect(mockUpdateDescription).toHaveBeenCalledWith(labelId, null);
		});

		it("存在しないラベルIDの場合エラーをスローすること", async () => {
			mockFindLabelById.mockResolvedValue(undefined);

			await expect(
				labelService.updateLabelDescription(999, newDescription),
			).rejects.toThrow("Label with id 999 not found");

			expect(mockFindLabelById).toHaveBeenCalledWith(999);
			expect(mockUpdateDescription).not.toHaveBeenCalled();
		});

		it("更新に失敗した場合エラーをスローすること", async () => {
			mockFindLabelById.mockResolvedValue(label);
			mockUpdateDescription.mockResolvedValue(undefined);

			await expect(
				labelService.updateLabelDescription(labelId, newDescription),
			).rejects.toThrow(
				`Failed to update description for label with id ${labelId}`,
			);

			expect(mockFindLabelById).toHaveBeenCalledWith(labelId);
			expect(mockUpdateDescription).toHaveBeenCalledWith(
				labelId,
				newDescription,
			);
		});
	});

	describe("deleteLabel", () => {
		const labelId = 1;

		it("ラベルを削除できること", async () => {
			mockFindBookmarkById.mockResolvedValue({
				id: labelId,
				name: "typescript",
				description: "TypeScriptに関する記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockDeleteById.mockResolvedValue(true);

			await expect(labelService.deleteLabel(labelId)).resolves.not.toThrow();
			expect(mockDeleteById).toHaveBeenCalledWith(labelId);
		});

		it("存在しないラベルIDの場合、エラーをスローすること", async () => {
			mockDeleteById.mockResolvedValue(false);

			await expect(labelService.deleteLabel(labelId)).rejects.toThrow(
				`Label with id ${labelId} not found`,
			);
			expect(mockDeleteById).toHaveBeenCalledWith(labelId);
		});

		it("DBエラーの場合、エラーをスローすること", async () => {
			const error = new Error("Database error");
			mockDeleteById.mockRejectedValue(error);

			await expect(labelService.deleteLabel(labelId)).rejects.toThrow(error);
			expect(mockDeleteById).toHaveBeenCalledWith(labelId);
		});
	});

	describe("cleanupUnusedLabels", () => {
		it("未使用のラベルを一括削除できること", async () => {
			const labelsWithCount = [
				{
					id: 1,
					name: "typescript",
					description: "TypeScriptに関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 5, // 使用中
				},
				{
					id: 2,
					name: "unused-label-1",
					description: "未使用のラベル1",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 0, // 未使用
				},
				{
					id: 3,
					name: "unused-label-2",
					description: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 0, // 未使用
				},
			];

			const deletedLabels = [
				{
					id: 2,
					name: "unused-label-1",
					description: "未使用のラベル1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					name: "unused-label-2",
					description: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockFindAllWithArticleCount.mockResolvedValue(labelsWithCount);
			mockDeleteMany.mockResolvedValue(deletedLabels);

			const result = await labelService.cleanupUnusedLabels();

			expect(result).toEqual({
				deletedCount: 2,
				deletedLabels: [
					{ id: 2, name: "unused-label-1" },
					{ id: 3, name: "unused-label-2" },
				],
			});
			expect(mockFindAllWithArticleCount).toHaveBeenCalledOnce();
			expect(mockDeleteMany).toHaveBeenCalledWith([2, 3]);
		});

		it("全てのラベルが使用中の場合、何も削除しないこと", async () => {
			const labelsWithCount = [
				{
					id: 1,
					name: "typescript",
					description: "TypeScriptに関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 5,
				},
				{
					id: 2,
					name: "react",
					description: "Reactに関する記事",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 3,
				},
			];

			mockFindAllWithArticleCount.mockResolvedValue(labelsWithCount);

			const result = await labelService.cleanupUnusedLabels();

			expect(result).toEqual({
				deletedCount: 0,
				deletedLabels: [],
			});
			expect(mockFindAllWithArticleCount).toHaveBeenCalledOnce();
			expect(mockDeleteMany).not.toHaveBeenCalled();
		});

		it("ラベルが存在しない場合、何も削除しないこと", async () => {
			mockFindAllWithArticleCount.mockResolvedValue([]);

			const result = await labelService.cleanupUnusedLabels();

			expect(result).toEqual({
				deletedCount: 0,
				deletedLabels: [],
			});
			expect(mockFindAllWithArticleCount).toHaveBeenCalledOnce();
			expect(mockDeleteMany).not.toHaveBeenCalled();
		});

		it("削除処理でエラーが発生した場合、エラーをスローすること", async () => {
			const labelsWithCount = [
				{
					id: 1,
					name: "unused-label",
					description: "未使用のラベル",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 0,
				},
			];

			const error = new Error("Database error");
			mockFindAllWithArticleCount.mockResolvedValue(labelsWithCount);
			mockDeleteMany.mockRejectedValue(error);

			await expect(labelService.cleanupUnusedLabels()).rejects.toThrow(error);
			expect(mockFindAllWithArticleCount).toHaveBeenCalledOnce();
			expect(mockDeleteMany).toHaveBeenCalledWith([1]);
		});
	});
});
