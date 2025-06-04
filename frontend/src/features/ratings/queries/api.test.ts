/**
 * 記事評価ポイント機能のAPI通信のテスト
 */
import { expect, test, vi } from "vitest";
import type { CreateRatingData, RatingFilters } from "../types";
import {
	createRating,
	deleteRating,
	fetchArticleRating,
	fetchRatingStats,
	fetchRatings,
	updateRating,
} from "./api";

if (import.meta.vitest) {
	// フェッチのモック
	const mockFetch = vi.fn();
	global.fetch = mockFetch;

	test("fetchRatings - 成功時の動作", async () => {
		const mockResponse = {
			success: true,
			ratings: [
				{
					rating: {
						id: 1,
						articleId: 123,
						practicalValue: 8,
						technicalDepth: 7,
						understanding: 9,
						novelty: 6,
						importance: 8,
						totalScore: 76,
						comment: "参考になりました",
						createdAt: "2023-01-01T00:00:00Z",
						updatedAt: "2023-01-01T00:00:00Z",
					},
					article: {
						id: 123,
						url: "https://example.com",
						title: "テスト記事",
						isRead: false,
						createdAt: "2023-01-01T00:00:00Z",
						updatedAt: "2023-01-01T00:00:00Z",
					},
				},
			],
			count: 1,
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const filters: RatingFilters = {
			sortBy: "totalScore",
			order: "desc",
			limit: 10,
		};

		const result = await fetchRatings(filters);

		expect(result).toHaveLength(1);
		expect(result[0].rating.totalScore).toBe(76);
		expect(result[0].article.title).toBe("テスト記事");
	});

	test("fetchRatingStats - 成功時の動作", async () => {
		const mockStats = {
			success: true,
			stats: {
				totalCount: 100,
				averageScore: 7.5,
				averagePracticalValue: 7.8,
				averageTechnicalDepth: 7.2,
				averageUnderstanding: 7.9,
				averageNovelty: 6.5,
				averageImportance: 7.6,
				ratingsWithComments: 80,
			},
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockStats,
		});

		const result = await fetchRatingStats();

		expect(result.totalCount).toBe(100);
		expect(result.averageScore).toBe(7.5);
		expect(result.ratingsWithComments).toBe(80);
	});

	test("fetchArticleRating - 評価が存在しない場合はnullを返す", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: "Not Found",
		});

		const result = await fetchArticleRating(999);

		expect(result).toBeNull();
	});

	test("createRating - 成功時の動作", async () => {
		const mockRating = {
			success: true,
			rating: {
				id: 1,
				articleId: 123,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "参考になりました",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
			},
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockRating,
		});

		const ratingData: CreateRatingData = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			comment: "参考になりました",
		};

		const result = await createRating(123, ratingData);

		expect(result.totalScore).toBe(76);
		expect(result.comment).toBe("参考になりました");
	});

	test("API呼び出し失敗時はエラーをthrowする", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		});

		await expect(fetchRatings()).rejects.toThrow(
			"評価一覧の取得に失敗しました",
		);
	});
}
