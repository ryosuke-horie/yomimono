import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleLabel } from "../db/schema";
import { ArticleLabelRepository } from "./articleLabel";

const { mockDb, drizzleModuleMock } = vi.hoisted(() => {
	const drizzleMock = require("../tests/drizzle-mock") as typeof import("../tests/drizzle-mock");
	const mockDb = drizzleMock.createDrizzleClientMock();
	return {
		mockDb,
		drizzleModuleMock: drizzleMock.createDrizzleD1ModuleMock(mockDb),
	};
});

vi.mock("drizzle-orm/d1", () => drizzleModuleMock);

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
