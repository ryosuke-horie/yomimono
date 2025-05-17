import type { DrizzleD1Database } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleLabelRepository } from "../../../src/repositories/articleLabel";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

// Mock Drizzle modules
vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockReturnThis(),
		all: vi.fn(),
		get: vi.fn(),
	})),
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn(),
	gte: vi.fn(),
	isNull: vi.fn(),
	and: vi.fn(),
	count: vi.fn(),
	inArray: vi.fn(),
}));

describe("バッチラベル付け関連のリポジトリメソッド", () => {
	describe("ArticleLabelRepository - createMany", () => {
		let repository: ArticleLabelRepository;
		let mockDb: unknown;

		beforeEach(() => {
			mockDb = {
				prepare: vi.fn().mockReturnThis(),
				bind: vi.fn().mockReturnThis(),
				all: vi.fn(),
				get: vi.fn(),
			};
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			repository = new ArticleLabelRepository(mockDb as any);
		});

		it("複数の記事ラベルを一括で作成できる", async () => {
			const mockData = [
				{ articleId: 1, labelId: 1 },
				{ articleId: 2, labelId: 1 },
			];

			const expectedResults = [
				{ id: 1, articleId: 1, labelId: 1, createdAt: new Date() },
				{ id: 2, articleId: 2, labelId: 1, createdAt: new Date() },
			];

			// Mock Drizzle calls
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const mockedDb = (repository as any).db;
			mockedDb.insert.mockReturnThis();
			mockedDb.values.mockReturnThis();
			mockedDb.returning.mockReturnThis();
			mockedDb.all.mockResolvedValue(expectedResults);

			const results = await repository.createMany(mockData);

			expect(results).toBe(expectedResults);
			expect(mockedDb.insert).toHaveBeenCalled();
		});
	});

	describe("ArticleLabelRepository - findExistingArticleIds", () => {
		let repository: ArticleLabelRepository;
		let mockDb: unknown;

		beforeEach(() => {
			mockDb = {
				prepare: vi.fn().mockReturnThis(),
				bind: vi.fn().mockReturnThis(),
				all: vi.fn(),
				get: vi.fn(),
			};
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			repository = new ArticleLabelRepository(mockDb as any);
		});

		it("既にラベル付けされている記事IDのSetを返す", async () => {
			const articleIds = [1, 2, 3, 4];
			const existingLabels = [{ articleId: 1 }, { articleId: 3 }];

			// Mock Drizzle calls
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const mockedDb = (repository as any).db;
			mockedDb.select.mockReturnThis();
			mockedDb.from.mockReturnThis();
			mockedDb.where.mockReturnThis();
			mockedDb.all.mockResolvedValue(existingLabels);

			const result = await repository.findExistingArticleIds(articleIds);

			expect(result).toEqual(new Set([1, 3]));
		});
	});

	describe("DrizzleBookmarkRepository - findByIds", () => {
		let repository: DrizzleBookmarkRepository;
		let mockDb: unknown;

		beforeEach(() => {
			mockDb = {
				prepare: vi.fn().mockReturnThis(),
				bind: vi.fn().mockReturnThis(),
				all: vi.fn(),
				get: vi.fn(),
			};
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			repository = new DrizzleBookmarkRepository(mockDb as any);
		});

		it("指定されたIDのブックマークをMapで返す", async () => {
			const ids = [1, 2, 3];
			const mockBookmarks = [
				{
					bookmark: {
						id: 1,
						url: "https://example.com/1",
						title: "Article 1",
						description: null,
						createdAt: new Date(),
						updatedAt: new Date(),
						isRead: false,
					},
					favorite: null,
					label: null,
				},
				{
					bookmark: {
						id: 3,
						url: "https://example.com/3",
						title: "Article 3",
						description: null,
						createdAt: new Date(),
						updatedAt: new Date(),
						isRead: false,
					},
					favorite: { id: 1, bookmarkId: 3, createdAt: new Date() },
					label: {
						id: 1,
						name: "javascript",
						description: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			];

			// Mock Drizzle calls
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const mockedDb = (repository as any).db;
			mockedDb.select.mockReturnThis();
			mockedDb.from.mockReturnThis();
			mockedDb.leftJoin.mockReturnThis();
			mockedDb.where.mockReturnThis();
			mockedDb.all.mockResolvedValue(mockBookmarks);

			const result = await repository.findByIds(ids);

			expect(result.size).toBe(2);
			expect(result.get(1)).toMatchObject({
				id: 1,
				title: "Article 1",
				isFavorite: false,
				label: null,
			});
			expect(result.get(3)).toMatchObject({
				id: 3,
				title: "Article 3",
				isFavorite: true,
				label: { id: 1, name: "javascript" },
			});
			expect(result.get(2)).toBeUndefined();
		});
	});
});
