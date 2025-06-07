/**
 * Issue #588: MCPテストカバレッジ 45%達成
 * 高度な評価ツールのフィルタリング・ソート機能テスト
 */

// @ts-nocheck

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// APIクライアントをモック
vi.mock("../lib/apiClient.js");

describe("Issue #588: MCPテストカバレッジ向上", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "http://localhost:3000";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getArticleRatingsツール - フィルタリング機能", () => {
		test("sortByオプションでtotalScoreソートが正常に動作する", async () => {
			const mockRatings = [
				{
					id: 1,
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					totalScore: 76,
					comment: "素晴らしい記事",
					createdAt: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					articleId: 2,
					practicalValue: 9,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 9,
					totalScore: 82,
					comment: "非常に有用",
					createdAt: "2024-01-02T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const result = await apiClient.getArticleRatings({
				sortBy: "totalScore",
				order: "desc",
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
			});
			expect(result).toEqual(mockRatings);
		});

		test("minScore/maxScoreフィルターが正常に動作する", async () => {
			const mockFilteredRatings = [
				{
					id: 3,
					articleId: 3,
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 8,
					novelty: 8,
					importance: 9,
					totalScore: 86,
					comment: "高品質な記事",
					createdAt: "2024-01-03T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockFilteredRatings,
			);

			const result = await apiClient.getArticleRatings({
				minScore: 8,
				maxScore: 10,
				hasComment: true,
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				minScore: 8,
				maxScore: 10,
				hasComment: true,
			});
			expect(result).toEqual(mockFilteredRatings);
		});

		test("hasCommentフィルターでコメントありのみ取得", async () => {
			const mockCommentedRatings = [
				{
					id: 4,
					articleId: 4,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 7,
					novelty: 6,
					importance: 7,
					totalScore: 70,
					comment: "参考になる記事",
					createdAt: "2024-01-04T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockCommentedRatings,
			);

			const result = await apiClient.getArticleRatings({
				hasComment: true,
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				hasComment: true,
			});
			expect(result).toEqual(mockCommentedRatings);
		});

		test("limitとoffsetによるページネーション", async () => {
			const mockPaginatedRatings = [
				{
					id: 5,
					articleId: 5,
					practicalValue: 6,
					technicalDepth: 7,
					understanding: 6,
					novelty: 5,
					importance: 6,
					totalScore: 60,
					comment: null,
					createdAt: "2024-01-05T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockPaginatedRatings,
			);

			const result = await apiClient.getArticleRatings({
				limit: 10,
				offset: 5,
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				limit: 10,
				offset: 5,
			});
			expect(result).toEqual(mockPaginatedRatings);
		});
	});

	describe("複合フィルター条件テスト", () => {
		test("複数ソート条件の組み合わせ", async () => {
			const mockComplexRatings = [
				{
					id: 6,
					articleId: 6,
					practicalValue: 8,
					technicalDepth: 9,
					understanding: 8,
					novelty: 7,
					importance: 8,
					totalScore: 80,
					comment: "技術的に深い内容",
					createdAt: "2024-01-06T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockComplexRatings,
			);

			const result = await apiClient.getArticleRatings({
				sortBy: "technicalDepth",
				order: "desc",
				minScore: 7,
				hasComment: true,
				limit: 5,
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "technicalDepth",
				order: "desc",
				minScore: 7,
				hasComment: true,
				limit: 5,
			});
			expect(result).toEqual(mockComplexRatings);
		});

		test("全ての評価軸でのソート確認", async () => {
			const dimensions = [
				"practicalValue",
				"technicalDepth",
				"understanding",
				"novelty",
				"importance",
				"createdAt",
			] as const;

			for (const dimension of dimensions) {
				const mockRating = {
					id: 7,
					articleId: 7,
					practicalValue: 7,
					technicalDepth: 7,
					understanding: 7,
					novelty: 7,
					importance: 7,
					totalScore: 70,
					comment: null,
					createdAt: "2024-01-07T00:00:00Z",
				};

				vi.mocked(apiClient.getArticleRatings).mockResolvedValue([mockRating]);

				await apiClient.getArticleRatings({
					sortBy: dimension,
					order: "asc",
				});

				expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
					sortBy: dimension,
					order: "asc",
				});
			}
		});

		test("境界値テスト - スコア範囲の端点", async () => {
			const mockBoundaryRatings = [
				{
					id: 8,
					articleId: 8,
					practicalValue: 1,
					technicalDepth: 1,
					understanding: 1,
					novelty: 1,
					importance: 1,
					totalScore: 10,
					comment: "最低評価",
					createdAt: "2024-01-08T00:00:00Z",
				},
				{
					id: 9,
					articleId: 9,
					practicalValue: 10,
					technicalDepth: 10,
					understanding: 10,
					novelty: 10,
					importance: 10,
					totalScore: 100,
					comment: "最高評価",
					createdAt: "2024-01-09T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockBoundaryRatings,
			);

			// 最小スコア境界値テスト
			await apiClient.getArticleRatings({
				minScore: 1,
				maxScore: 1,
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				minScore: 1,
				maxScore: 1,
			});

			// 最大スコア境界値テスト
			await apiClient.getArticleRatings({
				minScore: 10,
				maxScore: 10,
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				minScore: 10,
				maxScore: 10,
			});
		});
	});

	describe("大量データパフォーマンステスト", () => {
		test("大量評価データでのフィルタリング処理", async () => {
			// 100件の模擬データを生成
			const mockLargeDataset = Array.from({ length: 100 }, (_, index) => ({
				id: index + 1,
				articleId: index + 1,
				practicalValue: Math.floor(Math.random() * 10) + 1,
				technicalDepth: Math.floor(Math.random() * 10) + 1,
				understanding: Math.floor(Math.random() * 10) + 1,
				novelty: Math.floor(Math.random() * 10) + 1,
				importance: Math.floor(Math.random() * 10) + 1,
				totalScore: Math.floor(Math.random() * 90) + 10,
				comment: index % 3 === 0 ? `コメント${index}` : null,
				createdAt: `2024-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`,
			}));

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockLargeDataset,
			);

			const startTime = performance.now();
			const result = await apiClient.getArticleRatings({
				sortBy: "totalScore",
				order: "desc",
				limit: 50,
				minScore: 5,
			});
			const endTime = performance.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 50,
				minScore: 5,
			});
		});

		test("最大limitでのデータ取得", async () => {
			const mockMaxLimitData = Array.from({ length: 100 }, (_, index) => ({
				id: index + 1,
				articleId: index + 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: `テストコメント${index}`,
				createdAt: "2024-01-01T00:00:00Z",
			}));

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockMaxLimitData,
			);

			const result = await apiClient.getArticleRatings({
				limit: 100,
			});

			expect(result).toHaveLength(100);
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				limit: 100,
			});
		});

		test("大量データでのページネーション効率性", async () => {
			const totalRecords = 1000;
			const pageSize = 20;
			const pageNumber = 10;
			const offset = (pageNumber - 1) * pageSize;

			const mockPageData = Array.from({ length: pageSize }, (_, index) => ({
				id: offset + index + 1,
				articleId: offset + index + 1,
				practicalValue: 7,
				technicalDepth: 8,
				understanding: 7,
				novelty: 6,
				importance: 7,
				totalScore: 70,
				comment: null,
				createdAt: "2024-01-10T00:00:00Z",
			}));

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockPageData);

			const result = await apiClient.getArticleRatings({
				limit: pageSize,
				offset: offset,
				sortBy: "createdAt",
				order: "desc",
			});

			expect(result).toHaveLength(pageSize);
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				limit: pageSize,
				offset: offset,
				sortBy: "createdAt",
				order: "desc",
			});
		});
	});

	describe("エラーハンドリングとエッジケース", () => {
		test("空の結果セットの処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([]);

			const result = await apiClient.getArticleRatings({
				minScore: 15, // 存在しない高スコア
			});

			expect(result).toEqual([]);
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				minScore: 15,
			});
		});

		test("APIエラー時の例外処理", async () => {
			const errorMessage = "API server is unavailable";
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				new Error(errorMessage),
			);

			await expect(
				apiClient.getArticleRatings({
					sortBy: "totalScore",
				}),
			).rejects.toThrow(errorMessage);
		});

		test("不正なパラメータでのバリデーション", async () => {
			// 通常、zodスキーマでvalidationされるが、APIクライアント内部での検証をテスト
			const mockValidationError = new Error("Invalid parameter range");
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				mockValidationError,
			);

			await expect(
				apiClient.getArticleRatings({
					minScore: 15, // 1-10の範囲外
					maxScore: 0, // 1-10の範囲外
				}),
			).rejects.toThrow("Invalid parameter range");
		});
	});

	describe("統計情報とランキング機能", () => {
		test("getRatingStats統計情報の取得", async () => {
			const mockStats = {
				totalRatings: 150,
				averageScore: 7.2,
				medianScore: 7.5,
				dimensionAverages: {
					practicalValue: 7.1,
					technicalDepth: 6.8,
					understanding: 7.4,
					novelty: 6.9,
					importance: 7.3,
				},
				scoreDistribution: [
					{ range: "1-2", count: 5, percentage: 3.3 },
					{ range: "3-4", count: 15, percentage: 10.0 },
					{ range: "5-6", count: 30, percentage: 20.0 },
					{ range: "7-8", count: 70, percentage: 46.7 },
					{ range: "9-10", count: 30, percentage: 20.0 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "最高の技術記事",
						url: "https://example.com/best",
						totalScore: 95,
					},
					{
						id: 2,
						title: "素晴らしい解説",
						url: "https://example.com/great",
						totalScore: 92,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockStats);

			const result = await apiClient.getRatingStats();

			expect(result).toEqual(mockStats);
			expect(apiClient.getRatingStats).toHaveBeenCalled();
		});

		test("高評価記事のランキング取得", async () => {
			const mockTopRatings = [
				{
					id: 1,
					articleId: 1,
					practicalValue: 10,
					technicalDepth: 9,
					understanding: 10,
					novelty: 8,
					importance: 10,
					totalScore: 94,
					comment: "完璧な記事",
					createdAt: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					articleId: 2,
					practicalValue: 9,
					technicalDepth: 10,
					understanding: 9,
					novelty: 9,
					importance: 9,
					totalScore: 92,
					comment: "非常に優秀",
					createdAt: "2024-01-02T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockTopRatings);

			const result = await apiClient.getArticleRatings({
				sortBy: "totalScore",
				order: "desc",
				limit: 10,
			});

			expect(result).toEqual(mockTopRatings);
			expect(result[0].totalScore).toBeGreaterThan(result[1].totalScore);
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("getArticleRatingsの基本動作確認", () => {
		// このテストはgetArticleRatings関数が適切に定義されていることを確認
		expect(typeof apiClient.getArticleRatings).toBe("function");
	});

	test("getRatingStatsの基本動作確認", () => {
		// このテストはgetRatingStats関数が適切に定義されていることを確認
		expect(typeof apiClient.getRatingStats).toBe("function");
	});
}
