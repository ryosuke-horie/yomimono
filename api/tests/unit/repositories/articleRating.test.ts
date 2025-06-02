/**
 * 記事評価ポイントリポジトリのテストコード
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	ArticleRating,
	InsertArticleRating,
} from "../../../src/db/schema";
import { DrizzleArticleRatingRepository } from "../../../src/repositories/articleRating";

const mockDbClient = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	delete: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	offset: vi.fn().mockReturnThis(),
};

// Drizzle ORMをモック
vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDbClient),
}));

describe("DrizzleArticleRatingRepository", () => {
	let repository: DrizzleArticleRatingRepository;
	let mockDb: D1Database;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = {} as D1Database;
		repository = new DrizzleArticleRatingRepository(mockDb);
	});

	describe("create", () => {
		it("記事の評価を正常に作成できること", async () => {
			const insertData: InsertArticleRating = {
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "とても良い記事でした",
				totalScore: 0, // 自動計算される
			};

			const expectedResult: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76, // (8+7+9+6+8)/5 * 10 = 76
				comment: "とても良い記事でした",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDbClient.returning.mockResolvedValueOnce([expectedResult]);

			const result = await repository.create(insertData);

			expect(result).toEqual(expectedResult);
			expect(mockDbClient.insert).toHaveBeenCalled();
			expect(mockDbClient.values).toHaveBeenCalledWith(
				expect.objectContaining({
					...insertData,
					totalScore: 76,
				}),
			);
		});

		it("作成に失敗した場合はエラーを投げること", async () => {
			const insertData: InsertArticleRating = {
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 0,
			};

			mockDbClient.returning.mockResolvedValueOnce([]);

			await expect(repository.create(insertData)).rejects.toThrow(
				"Failed to create article rating",
			);
		});
	});

	describe("findByArticleId", () => {
		it("記事IDで評価を正常に取得できること", async () => {
			const expectedRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "テストコメント",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDbClient.limit.mockResolvedValueOnce([expectedRating]);

			const result = await repository.findByArticleId(1);

			expect(result).toEqual(expectedRating);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.limit).toHaveBeenCalledWith(1);
		});

		it("評価が存在しない場合はnullを返すこと", async () => {
			mockDbClient.limit.mockResolvedValueOnce([]);

			const result = await repository.findByArticleId(999);

			expect(result).toBeNull();
		});
	});

	describe("update", () => {
		it("記事の評価を正常に更新できること", async () => {
			const currentRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "元のコメント",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const updateData = {
				practicalValue: 9,
				comment: "更新されたコメント",
			};

			const expectedResult: ArticleRating = {
				...currentRating,
				practicalValue: 9,
				totalScore: 78, // (9+7+9+6+8)/5 * 10 = 78
				comment: "更新されたコメント",
				updatedAt: new Date(),
			};

			// findByArticleIdのモック
			mockDbClient.limit.mockResolvedValueOnce([currentRating]);
			// updateのモック
			mockDbClient.returning.mockResolvedValueOnce([expectedResult]);

			const result = await repository.update(1, updateData);

			expect(result).toEqual(expectedResult);
			expect(mockDbClient.update).toHaveBeenCalled();
			expect(mockDbClient.set).toHaveBeenCalledWith(
				expect.objectContaining({
					...updateData,
					totalScore: 78,
					updatedAt: expect.any(Date),
				}),
			);
		});

		it("存在しない記事IDの場合はnullを返すこと", async () => {
			mockDbClient.limit.mockResolvedValueOnce([]);

			const result = await repository.update(999, { practicalValue: 9 });

			expect(result).toBeNull();
		});
	});

	describe("delete", () => {
		it("記事の評価を正常に削除できること", async () => {
			const deletedRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "削除される評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDbClient.returning.mockResolvedValueOnce([deletedRating]);

			const result = await repository.delete(1);

			expect(result).toBe(true);
			expect(mockDbClient.delete).toHaveBeenCalled();
		});

		it("存在しない記事IDの場合はfalseを返すこと", async () => {
			mockDbClient.returning.mockResolvedValueOnce([]);

			const result = await repository.delete(999);

			expect(result).toBe(false);
		});
	});

	describe("findMany", () => {
		it("評価一覧を正常に取得できること", async () => {
			const ratings: ArticleRating[] = [
				{
					id: 1,
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					totalScore: 76,
					comment: "評価1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					articleId: 2,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 9,
					totalScore: 78,
					comment: "評価2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDbClient.offset.mockResolvedValueOnce(ratings);

			const result = await repository.findMany({
				sortBy: "totalScore",
				order: "desc",
				limit: 10,
				offset: 0,
			});

			expect(result).toEqual(ratings);
			expect(mockDbClient.orderBy).toHaveBeenCalled();
			expect(mockDbClient.limit).toHaveBeenCalledWith(10);
			expect(mockDbClient.offset).toHaveBeenCalledWith(0);
		});
	});

	describe("getStats", () => {
		it("評価統計情報を正常に取得できること", async () => {
			const statsResult = [
				{
					totalCount: 10,
					averageScore: 75.5,
					averagePracticalValue: 7.8,
					averageTechnicalDepth: 7.2,
					averageUnderstanding: 8.1,
					averageNovelty: 6.9,
					averageImportance: 7.5,
				},
			];

			const commentsResult = [{ ratingsWithComments: 7 }];

			// 1回目の呼び出し（統計情報）
			const mockSelect1 = {
				...mockDbClient,
				from: vi.fn().mockResolvedValueOnce(statsResult),
			};

			// 2回目の呼び出し（コメント統計）
			const mockSelect2 = {
				...mockDbClient,
				where: vi.fn().mockResolvedValueOnce(commentsResult),
			};

			mockDbClient.select
				.mockReturnValueOnce(mockSelect1)
				.mockReturnValueOnce(mockSelect2);

			const result = await repository.getStats();

			expect(result).toEqual({
				totalCount: 10,
				averageScore: 7.55, // 75.5 / 10
				averagePracticalValue: 7.8,
				averageTechnicalDepth: 7.2,
				averageUnderstanding: 8.1,
				averageNovelty: 6.9,
				averageImportance: 7.5,
				ratingsWithComments: 7,
			});
		});

		it("統計データがnullの場合は0を返すこと", async () => {
			const statsResult = [
				{
					totalCount: 0,
					averageScore: null,
					averagePracticalValue: null,
					averageTechnicalDepth: null,
					averageUnderstanding: null,
					averageNovelty: null,
					averageImportance: null,
				},
			];

			const commentsResult = [{ ratingsWithComments: 0 }];

			// 1回目の呼び出し（統計情報）
			const mockSelect1 = {
				...mockDbClient,
				from: vi.fn().mockResolvedValueOnce(statsResult),
			};

			// 2回目の呼び出し（コメント統計）
			const mockSelect2 = {
				...mockDbClient,
				where: vi.fn().mockResolvedValueOnce(commentsResult),
			};

			mockDbClient.select
				.mockReturnValueOnce(mockSelect1)
				.mockReturnValueOnce(mockSelect2);

			const result = await repository.getStats();

			expect(result).toEqual({
				totalCount: 0,
				averageScore: 0,
				averagePracticalValue: 0,
				averageTechnicalDepth: 0,
				averageUnderstanding: 0,
				averageNovelty: 0,
				averageImportance: 0,
				ratingsWithComments: 0,
			});
		});

		it("統計情報取得時にエラーが発生した場合はエラーをスローすること", async () => {
			const error = new Error("Database error");
			
			const mockSelect1 = {
				...mockDbClient,
				from: vi.fn().mockRejectedValueOnce(error),
			};

			mockDbClient.select.mockReturnValueOnce(mockSelect1);

			await expect(repository.getStats()).rejects.toThrow("Database error");
		});
	});
});
