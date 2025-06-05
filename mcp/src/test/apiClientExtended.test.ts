/**
 * APIクライアント拡張テスト - カバレッジ向上のための追加テスト
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	type GetRatingsOptions,
	deleteArticleRating,
	getArticleRatings,
	getLabels,
	getRatingStats,
	getUnlabeledArticles,
} from "../lib/apiClient.js";

// fetchをモック
global.fetch = vi.fn();

describe("API Client Extended Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	// getApiBaseUrlは非公開関数のためテスト対象から除外

	describe("getUnlabeledArticles", () => {
		test("正常な未ラベル記事の取得", async () => {
			const mockArticles = [
				{ id: 1, title: "Test Article", url: "https://example.com" },
			];

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockArticles,
				}),
			} as Response);

			const result = await getUnlabeledArticles();
			expect(result).toEqual(mockArticles);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/unlabeled",
			);
		});

		test("APIリクエスト失敗時のエラーハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Internal Server Error",
			} as Response);

			await expect(getUnlabeledArticles()).rejects.toThrow(
				"Failed to fetch unlabeled articles: Internal Server Error",
			);
		});

		test("無効なAPIレスポンス形式のエラーハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ invalid: "response" }),
			} as Response);

			await expect(getUnlabeledArticles()).rejects.toThrow(
				"Invalid API response for unlabeled articles",
			);
		});
	});

	describe("getLabels", () => {
		test("正常なラベル一覧の取得", async () => {
			const mockLabels = [{ id: 1, name: "技術", description: "技術記事" }];

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					labels: mockLabels,
				}),
			} as Response);

			const result = await getLabels();
			expect(result).toEqual(mockLabels);
			expect(fetch).toHaveBeenCalledWith("https://api.example.com/api/labels");
		});

		test("ラベル取得時のAPIエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(getLabels()).rejects.toThrow(
				"Failed to fetch labels: Not Found",
			);
		});

		test("ラベル取得時の無効なレスポンス", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ success: false }),
			} as Response);

			await expect(getLabels()).rejects.toThrow(
				"Invalid API response for labels",
			);
		});
	});

	describe("deleteArticleRating", () => {
		test("記事評価の正常な削除", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
			} as Response);

			await expect(deleteArticleRating(123)).resolves.not.toThrow();
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/123/rating",
				{ method: "DELETE" },
			);
		});

		test("記事評価削除時のAPIエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(deleteArticleRating(123)).rejects.toThrow(
				"Failed to delete rating for article 123: Not Found",
			);
		});
	});

	describe("getArticleRatings", () => {
		test("フィルターオプション付きの評価一覧取得", async () => {
			const mockRatings = [
				{
					id: 1,
					articleId: 123,
					practicalValue: 8,
					technicalDepth: 9,
					understanding: 7,
					novelty: 6,
					importance: 8,
					totalScore: 38,
					comment: "テストコメント",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					ratings: mockRatings,
					count: 1,
				}),
			} as Response);

			const options: GetRatingsOptions = {
				sortBy: "totalScore",
				order: "desc",
				limit: 10,
				minScore: 5,
				hasComment: true,
			};

			const result = await getArticleRatings(options);
			expect(result).toEqual(mockRatings);

			const expectedUrl =
				"https://api.example.com/api/ratings?sortBy=totalScore&order=desc&limit=10&minScore=5&hasComment=true";
			expect(fetch).toHaveBeenCalledWith(expectedUrl);
		});

		test("オプションなしでの評価一覧取得", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					ratings: [],
					count: 0,
				}),
			} as Response);

			const result = await getArticleRatings();
			expect(result).toEqual([]);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/ratings?",
			);
		});

		test("全てのオプションを指定した評価一覧取得", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					ratings: [],
					count: 0,
				}),
			} as Response);

			const options: GetRatingsOptions = {
				sortBy: "createdAt",
				order: "asc",
				limit: 20,
				offset: 10,
				minScore: 3,
				maxScore: 8,
				hasComment: false,
			};

			await getArticleRatings(options);

			const expectedUrl =
				"https://api.example.com/api/ratings?sortBy=createdAt&order=asc&limit=20&offset=10&minScore=3&maxScore=8&hasComment=false";
			expect(fetch).toHaveBeenCalledWith(expectedUrl);
		});

		test("評価一覧取得時のAPIエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Bad Request",
			} as Response);

			await expect(getArticleRatings()).rejects.toThrow(
				"Failed to get article ratings: Bad Request",
			);
		});

		test("評価一覧取得時のJSONパースエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("JSON parse error");
				},
			} as Response);

			await expect(getArticleRatings()).rejects.toThrow(
				"Failed to parse response when getting article ratings: JSON parse error",
			);
		});

		test("評価一覧取得時の無効なレスポンス", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ invalid: "response" }),
			} as Response);

			await expect(getArticleRatings()).rejects.toThrow(
				"Invalid API response for article ratings",
			);
		});
	});

	describe("getRatingStats", () => {
		test("評価統計情報の正常な取得", async () => {
			const mockStats = {
				totalRatings: 10,
				averageScore: 7.5,
				medianScore: 8.0,
				dimensionAverages: {
					practicalValue: 7.8,
					technicalDepth: 7.2,
					understanding: 7.6,
					novelty: 7.1,
					importance: 7.9,
				},
				scoreDistribution: [
					{ range: "1-2", count: 0, percentage: 0 },
					{ range: "3-4", count: 1, percentage: 10 },
					{ range: "5-6", count: 2, percentage: 20 },
					{ range: "7-8", count: 4, percentage: 40 },
					{ range: "9-10", count: 3, percentage: 30 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "高評価記事",
						url: "https://example.com",
						totalScore: 45,
					},
				],
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					stats: mockStats,
				}),
			} as Response);

			const result = await getRatingStats();
			expect(result).toEqual(mockStats);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/ratings/stats",
			);
		});

		test("統計情報取得時のAPIエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Service Unavailable",
			} as Response);

			await expect(getRatingStats()).rejects.toThrow(
				"Failed to get rating stats: Service Unavailable",
			);
		});

		test("統計情報取得時のJSONパースエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Malformed JSON");
				},
			} as Response);

			await expect(getRatingStats()).rejects.toThrow(
				"Failed to parse response when getting rating stats: Malformed JSON",
			);
		});

		test("統計情報取得時の無効なレスポンス", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ invalid: "stats" }),
			} as Response);

			await expect(getRatingStats()).rejects.toThrow(
				"Invalid API response for rating stats",
			);
		});
	});
});
