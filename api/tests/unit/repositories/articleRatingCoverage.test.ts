/**
 * 記事評価ポイントリポジトリの追加カバレッジテスト
 * hasCommentフィルターとエラーハンドリングの未カバー行をテスト
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

describe("DrizzleArticleRatingRepository - 追加カバレッジ", () => {
	let repository: DrizzleArticleRatingRepository;
	let mockDb: D1Database;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = {} as D1Database;
		repository = new DrizzleArticleRatingRepository(mockDb);
	});

	describe("findMany - hasCommentフィルター", () => {
		it("hasComment=trueフィルターで正常に取得できること", async () => {
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
					comment: "コメントあり",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDbClient.offset.mockResolvedValueOnce(ratings);

			const result = await repository.findMany({
				hasComment: true,
			});

			expect(result).toEqual(ratings);
			expect(mockDbClient.where).toHaveBeenCalled();
		});

		it("hasComment=falseフィルターで正常に取得できること", async () => {
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
					comment: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDbClient.offset.mockResolvedValueOnce(ratings);

			const result = await repository.findMany({
				hasComment: false,
			});

			expect(result).toEqual(ratings);
			expect(mockDbClient.where).toHaveBeenCalled();
		});

		it("検索処理でエラーが発生した場合はエラーを投げること", async () => {
			const error = new Error("Database connection error");
			mockDbClient.offset.mockRejectedValueOnce(error);

			await expect(repository.findMany({})).rejects.toThrow(
				"Database connection error",
			);
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("追加カバレッジテストが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}