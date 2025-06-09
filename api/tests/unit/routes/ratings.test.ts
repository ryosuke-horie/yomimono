/**
 * 記事評価ポイントルーターのテストコード
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleRating } from "../../../src/db/schema";
import type { IRatingService } from "../../../src/interfaces/service/rating";
import { createRatingsRouter } from "../../../src/routes/ratings";

describe("RatingsRouter", () => {
	let mockRatingService: IRatingService;
	let app: ReturnType<typeof createRatingsRouter>;

	beforeEach(() => {
		mockRatingService = {
			createRating: vi.fn(),
			getRating: vi.fn(),
			updateRating: vi.fn(),
			deleteRating: vi.fn(),
			getRatings: vi.fn(),
			getRatingStats: vi.fn(),
		};
		app = createRatingsRouter(mockRatingService);
	});

	describe("POST /bookmarks/:id/rating", () => {
		it("正常な評価作成リクエストで201を返すこと", async () => {
			const mockRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "テスト評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const requestBody = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "テスト評価",
			};

			vi.mocked(mockRatingService.createRating).mockResolvedValueOnce(
				mockRating,
			);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(201);
			expect(result.success).toBe(true);
			expect(result.rating).toEqual(
				expect.objectContaining({
					id: mockRating.id,
					articleId: mockRating.articleId,
					practicalValue: mockRating.practicalValue,
					technicalDepth: mockRating.technicalDepth,
					understanding: mockRating.understanding,
					novelty: mockRating.novelty,
					importance: mockRating.importance,
					totalScore: mockRating.totalScore,
					comment: mockRating.comment,
				}),
			);
			expect(result.message).toBe("記事の評価を作成しました");
			expect(mockRatingService.createRating).toHaveBeenCalledWith(
				1,
				requestBody,
			);
		});

		it("無効なarticle IDで400を返すこと", async () => {
			const requestBody = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			const mockRequest = new Request(
				"http://localhost/bookmarks/invalid/rating",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(requestBody),
				},
			);

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(400);
			expect(result.success).toBe(false);
			expect(result.message).toBe("無効な記事IDです");
		});

		it("無効なリクエストボディで400を返すこと", async () => {
			const invalidRequestBody = {
				practicalValue: 11, // 無効値
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(invalidRequestBody),
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(422);
			expect(result.success).toBe(false);
			expect(result.message).toBe("リクエストデータが不正です");
		});

		it("サービスエラーで500を返すこと", async () => {
			const requestBody = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			vi.mocked(mockRatingService.createRating).mockRejectedValueOnce(
				new Error("Database error"),
			);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(500);
			expect(result.success).toBe(false);
			expect(result.message).toBe("Database error");
		});
	});

	describe("GET /bookmarks/:id/rating", () => {
		it("評価が存在する場合は200を返すこと", async () => {
			const mockRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "テスト評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockRatingService.getRating).mockResolvedValueOnce(mockRating);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "GET",
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.success).toBe(true);
			expect(result.rating).toEqual(
				expect.objectContaining({
					id: mockRating.id,
					articleId: mockRating.articleId,
					practicalValue: mockRating.practicalValue,
					technicalDepth: mockRating.technicalDepth,
					understanding: mockRating.understanding,
					novelty: mockRating.novelty,
					importance: mockRating.importance,
					totalScore: mockRating.totalScore,
					comment: mockRating.comment,
				}),
			);
			expect(mockRatingService.getRating).toHaveBeenCalledWith(1);
		});

		it("評価が存在しない場合は404を返すこと", async () => {
			vi.mocked(mockRatingService.getRating).mockResolvedValueOnce(null);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "GET",
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(404);
			expect(result.success).toBe(false);
			expect(result.message).toBe("指定された記事の評価が見つかりません");
		});
	});

	describe("PATCH /bookmarks/:id/rating", () => {
		it("正常な更新リクエストで200を返すこと", async () => {
			const mockRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 9,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 78,
				comment: "更新されたテスト評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const requestBody = {
				practicalValue: 9,
				comment: "更新されたテスト評価",
			};

			vi.mocked(mockRatingService.updateRating).mockResolvedValueOnce(
				mockRating,
			);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.success).toBe(true);
			expect(result.rating).toEqual(
				expect.objectContaining({
					id: mockRating.id,
					articleId: mockRating.articleId,
					practicalValue: mockRating.practicalValue,
					technicalDepth: mockRating.technicalDepth,
					understanding: mockRating.understanding,
					novelty: mockRating.novelty,
					importance: mockRating.importance,
					totalScore: mockRating.totalScore,
					comment: mockRating.comment,
				}),
			);
			expect(result.message).toBe("記事の評価を更新しました");
			expect(mockRatingService.updateRating).toHaveBeenCalledWith(
				1,
				requestBody,
			);
		});

		it("評価が見つからない場合は404を返すこと", async () => {
			const requestBody = {
				practicalValue: 9,
			};

			vi.mocked(mockRatingService.updateRating).mockRejectedValueOnce(
				new Error("指定された記事の評価が見つかりません"),
			);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(404);
			expect(result.success).toBe(false);
			expect(result.message).toBe("指定された記事の評価が見つかりません");
		});
	});

	describe("DELETE /bookmarks/:id/rating", () => {
		it("正常な削除リクエストで200を返すこと", async () => {
			vi.mocked(mockRatingService.deleteRating).mockResolvedValueOnce();

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "DELETE",
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.success).toBe(true);
			expect(result.message).toBe("記事の評価を削除しました");
			expect(mockRatingService.deleteRating).toHaveBeenCalledWith(1);
		});

		it("評価が見つからない場合は404を返すこと", async () => {
			vi.mocked(mockRatingService.deleteRating).mockRejectedValueOnce(
				new Error("指定された記事の評価が見つかりません"),
			);

			const mockRequest = new Request("http://localhost/bookmarks/1/rating", {
				method: "DELETE",
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(404);
			expect(result.success).toBe(false);
			expect(result.message).toBe("指定された記事の評価が見つかりません");
		});
	});

	describe("GET /ratings", () => {
		it("評価一覧を正常に取得できること", async () => {
			const mockRatings: ArticleRating[] = [
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
			];

			vi.mocked(mockRatingService.getRatings).mockResolvedValueOnce(
				mockRatings,
			);

			const mockRequest = new Request(
				"http://localhost/ratings?sortBy=totalScore&order=desc&limit=10",
				{
					method: "GET",
				},
			);

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.success).toBe(true);
			expect(result.ratings).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: mockRatings[0].id,
						articleId: mockRatings[0].articleId,
						practicalValue: mockRatings[0].practicalValue,
						technicalDepth: mockRatings[0].technicalDepth,
						understanding: mockRatings[0].understanding,
						novelty: mockRatings[0].novelty,
						importance: mockRatings[0].importance,
						totalScore: mockRatings[0].totalScore,
						comment: mockRatings[0].comment,
					}),
				]),
			);
			expect(result.count).toBe(1);
			expect(mockRatingService.getRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 10,
			});
		});

		it("無効なクエリパラメータで400を返すこと", async () => {
			const mockRequest = new Request(
				"http://localhost/ratings?limit=invalid",
				{
					method: "GET",
				},
			);

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(422);
			expect(result.success).toBe(false);
			expect(result.message).toBe("クエリパラメータが不正です");
		});
	});

	describe("GET /ratings/stats", () => {
		it("評価統計情報を正常に取得できること", async () => {
			const mockStats = {
				totalCount: 10,
				averageScore: 7.5,
				averagePracticalValue: 7.8,
				averageTechnicalDepth: 7.2,
				averageUnderstanding: 8.1,
				averageNovelty: 6.9,
				averageImportance: 7.5,
				ratingsWithComments: 7,
			};

			vi.mocked(mockRatingService.getRatingStats).mockResolvedValueOnce(
				mockStats,
			);

			const mockRequest = new Request("http://localhost/ratings/stats", {
				method: "GET",
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.success).toBe(true);
			expect(result.stats).toEqual(mockStats);
			expect(mockRatingService.getRatingStats).toHaveBeenCalled();
		});

		it("サービスエラーで500を返すこと", async () => {
			vi.mocked(mockRatingService.getRatingStats).mockRejectedValueOnce(
				new Error("Database error"),
			);

			const mockRequest = new Request("http://localhost/ratings/stats", {
				method: "GET",
			});

			const response = await app.fetch(mockRequest);
			const result = await response.json();

			expect(response.status).toBe(500);
			expect(result.success).toBe(false);
			expect(result.message).toBe("Database error");
		});
	});
});
