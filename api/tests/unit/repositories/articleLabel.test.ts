import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleLabel } from "../../../src/db/schema";
import { ArticleLabelRepository } from "../../../src/repositories/articleLabel";

const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	get: vi.fn(),
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
};

vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDb),
}));

describe("ArticleLabelRepository", () => {
	let articleLabelRepository: ArticleLabelRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		articleLabelRepository = new ArticleLabelRepository({} as D1Database);
	});

	describe("findByArticleId", () => {
		it("指定された記事IDに紐づく記事ラベルを取得できること", async () => {
			const mockArticleLabel: ArticleLabel = {
				id: 1,
				articleId: 10,
				labelId: 5,
				createdAt: new Date(),
			};
			mockDb.get.mockResolvedValue(mockArticleLabel);

			const result = await articleLabelRepository.findByArticleId(10);

			expect(result).toEqual(mockArticleLabel);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.get).toHaveBeenCalledOnce();
		});

		it("指定された記事IDに紐づく記事ラベルが存在しない場合、undefinedを返すこと", async () => {
			mockDb.get.mockResolvedValue(undefined);

			const result = await articleLabelRepository.findByArticleId(99);

			expect(result).toBeUndefined();
			expect(mockDb.get).toHaveBeenCalledOnce();
		});
	});

	describe("create", () => {
		it("新しい記事とラベルの紐付けを作成できること", async () => {
			const newArticleLabelData = { articleId: 20, labelId: 3 };
			const createdArticleLabel: ArticleLabel = {
				id: 2,
				...newArticleLabelData,
				createdAt: new Date(),
			};
			mockDb.get.mockResolvedValue(createdArticleLabel);

			const result = await articleLabelRepository.create(newArticleLabelData);

			expect(result).toEqual(createdArticleLabel);
			expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining(newArticleLabelData),
			);
			expect(mockDb.returning).toHaveBeenCalled();
			expect(mockDb.get).toHaveBeenCalledOnce();
		});
	});
});
