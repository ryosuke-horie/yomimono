import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleLabel } from "../db/schema";
import { createDrizzleMock, resetDrizzleMock } from "../tests/drizzle.mock";
import { ArticleLabelRepository } from "./articleLabel";

const { client: mockDbClient, drizzleMock } = createDrizzleMock();

vi.mock("drizzle-orm/d1", () => ({
	drizzle: drizzleMock,
}));

describe("ArticleLabelRepository", () => {
	let articleLabelRepository: ArticleLabelRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		resetDrizzleMock(mockDbClient);
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
			mockDbClient.get.mockResolvedValue(mockArticleLabel);

			const result = await articleLabelRepository.findByArticleId(10);

			expect(result).toEqual(mockArticleLabel);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});

		it("指定された記事IDに紐づく記事ラベルが存在しない場合、undefinedを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(undefined);

			const result = await articleLabelRepository.findByArticleId(99);

			expect(result).toBeUndefined();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
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
			mockDbClient.get.mockResolvedValue(createdArticleLabel);

			const result = await articleLabelRepository.create(newArticleLabelData);

			expect(result).toEqual(createdArticleLabel);
			expect(mockDbClient.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.values).toHaveBeenCalledWith(
				expect.objectContaining(newArticleLabelData),
			);
			expect(mockDbClient.returning).toHaveBeenCalled();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});
	});
});
