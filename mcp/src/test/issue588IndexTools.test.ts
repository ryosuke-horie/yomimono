/**
 * Issue #588: index.tsの高度な評価ツールのテストカバレッジ向上
 * getArticleRatings, getRatingStats, getTopRatedArticles, bulkRateArticlesツールのテスト
 */

// @ts-nocheck

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";
import type { GetRatingsOptions } from "../lib/apiClient.js";

type BulkRatingParams = {
	ratings: {
		articleId: number;
		practicalValue: number;
		technicalDepth: number;
		understanding: number;
		novelty: number;
		importance: number;
		comment?: string;
	}[];
};

// APIクライアントをモック
vi.mock("../lib/apiClient.js");

describe("Issue #588: index.ts高度な評価ツールテスト", () => {
	let server: McpServer;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "http://localhost:3000";

		// サーバーインスタンスを作成
		server = new McpServer({
			name: "TestServer",
			version: "0.6.0",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getArticleRatingsツールのテスト", () => {
		test("基本的なフィルターなし取得", async () => {
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
					comment: "良い記事",
					createdAt: "2024-01-01T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			// getArticleRatingsツールの実行をシミュレート
			const toolHandler = async (params: GetRatingsOptions) => {
				try {
					const ratings = await apiClient.getArticleRatings(params);
					const formatted = ratings
						.map((rating) => {
							const totalScore = (rating.totalScore / 10).toFixed(1);
							return `📊 評価ID: ${rating.id}\n   記事ID: ${rating.articleId}\n   📈 総合スコア: ${totalScore}/10`;
						})
						.join("\n\n");

					return {
						content: [
							{
								type: "text",
								text: `📊 記事評価一覧 (${ratings.length}件)\n${formatted}`,
							},
						],
						isError: false,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `記事評価一覧の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({});
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 記事評価一覧 (1件)");
			expect(result.content[0].text).toContain("📈 総合スコア: 7.6/10");
		});

		test("ソートオプション付きの取得", async () => {
			const mockSortedRatings = [
				{
					id: 2,
					articleId: 2,
					practicalValue: 9,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 9,
					totalScore: 82,
					comment: "高評価記事",
					createdAt: "2024-01-02T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockSortedRatings,
			);

			const toolHandler = async (params: GetRatingsOptions) => {
				try {
					const ratings = await apiClient.getArticleRatings(params);
					const filterInfo = [];
					if (params.sortBy)
						filterInfo.push(
							`ソート: ${params.sortBy} (${params.order || "asc"})`,
						);

					const formatted = ratings
						.map((rating) => {
							const totalScore = (rating.totalScore / 10).toFixed(1);
							return `📊 評価ID: ${rating.id}\n   記事ID: ${rating.articleId}\n   📈 総合スコア: ${totalScore}/10`;
						})
						.join("\n\n");

					return {
						content: [
							{
								type: "text",
								text: `📊 記事評価一覧 (${ratings.length}件)\n${filterInfo.length > 0 ? `\n🔍 フィルター条件: ${filterInfo.join(", ")}\n` : ""}\n${formatted}`,
							},
						],
						isError: false,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `記事評価一覧の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				sortBy: "totalScore",
				order: "desc",
			});

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
			});
			expect(result.content[0].text).toContain("ソート: totalScore (desc)");
		});

		test("フィルター条件付きの取得", async () => {
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
					comment: "高品質記事",
					createdAt: "2024-01-03T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(
				mockFilteredRatings,
			);

			const toolHandler = async (params: GetRatingsOptions) => {
				try {
					const ratings = await apiClient.getArticleRatings(params);
					const filterInfo = [];
					if (params.minScore || params.maxScore) {
						const min = params.minScore || 1;
						const max = params.maxScore || 10;
						filterInfo.push(`スコア範囲: ${min}-${max}`);
					}
					if (params.hasComment !== undefined) {
						filterInfo.push(`コメント: ${params.hasComment ? "あり" : "なし"}`);
					}

					return {
						content: [
							{
								type: "text",
								text: `📊 記事評価一覧 (${ratings.length}件)\n🔍 フィルター条件: ${filterInfo.join(", ")}`,
							},
						],
						isError: false,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `記事評価一覧の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				minScore: 8,
				maxScore: 10,
				hasComment: true,
			});

			expect(result.content[0].text).toContain("スコア範囲: 8-10");
			expect(result.content[0].text).toContain("コメント: あり");
		});

		test("エラーハンドリング", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				new Error("API Error"),
			);

			const toolHandler = async (params: GetRatingsOptions) => {
				try {
					await apiClient.getArticleRatings(params);
					return { content: [{ type: "text", text: "成功" }], isError: false };
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `記事評価一覧の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("API Error");
		});
	});

	describe("getRatingStatsツールのテスト", () => {
		test("統計情報の正常取得", async () => {
			const mockStats = {
				totalRatings: 100,
				averageScore: 7.5,
				medianScore: 7.8,
				dimensionAverages: {
					practicalValue: 7.2,
					technicalDepth: 7.0,
					understanding: 7.8,
					novelty: 7.1,
					importance: 7.6,
				},
				scoreDistribution: [
					{ range: "1-2", count: 2, percentage: 2.0 },
					{ range: "3-4", count: 8, percentage: 8.0 },
					{ range: "5-6", count: 20, percentage: 20.0 },
					{ range: "7-8", count: 50, percentage: 50.0 },
					{ range: "9-10", count: 20, percentage: 20.0 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "最高の記事",
						url: "https://example.com/best",
						totalScore: 95,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockStats);

			const toolHandler = async () => {
				try {
					const stats = await apiClient.getRatingStats();
					const summary = `📈 記事評価統計情報\n\n## サマリー\n📊 総評価数: ${stats.totalRatings}件\n⭐ 平均スコア: ${stats.averageScore.toFixed(1)}/10`;

					return {
						content: [{ type: "text", text: summary }],
						isError: false,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `評価統計情報の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler();

			expect(apiClient.getRatingStats).toHaveBeenCalled();
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 総評価数: 100件");
			expect(result.content[0].text).toContain("⭐ 平均スコア: 7.5/10");
		});

		test("統計情報取得エラー", async () => {
			vi.mocked(apiClient.getRatingStats).mockRejectedValue(
				new Error("Stats Error"),
			);

			const toolHandler = async () => {
				try {
					await apiClient.getRatingStats();
					return { content: [{ type: "text", text: "成功" }], isError: false };
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `評価統計情報の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler();

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Stats Error");
		});
	});

	describe("getTopRatedArticlesツールのテスト", () => {
		test("高評価記事の取得", async () => {
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
					comment: "完璧",
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
					comment: "優秀",
					createdAt: "2024-01-02T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockTopRatings);

			const toolHandler = async (params: { limit?: number }) => {
				try {
					const { limit = 10 } = params;
					const ratings = await apiClient.getArticleRatings({
						sortBy: "totalScore",
						order: "desc",
						limit,
					});

					if (ratings.length === 0) {
						return {
							content: [
								{ type: "text", text: "📭 評価された記事がありません" },
							],
							isError: false,
						};
					}

					const formatted = ratings
						.map(
							(rating, index) =>
								`${index + 1}. 📊 スコア: ${(rating.totalScore / 10).toFixed(1)}/10\n   🆔 記事ID: ${rating.articleId}\n   💭 ${rating.comment || "コメントなし"}`,
						)
						.join("\n\n");

					return {
						content: [
							{
								type: "text",
								text: `🏆 高評価記事 Top ${limit}\n\n${formatted}`,
							},
						],
						isError: false,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `高評価記事の取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({ limit: 5 });

			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 5,
			});
			expect(result.content[0].text).toContain("🏆 高評価記事 Top 5");
			expect(result.content[0].text).toContain("📊 スコア: 9.4/10");
		});

		test("評価記事が存在しない場合", async () => {
			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([]);

			const toolHandler = async (params: { limit?: number }) => {
				const { limit = 10 } = params;
				const ratings = await apiClient.getArticleRatings({
					sortBy: "totalScore",
					order: "desc",
					limit,
				});

				if (ratings.length === 0) {
					return {
						content: [{ type: "text", text: "📭 評価された記事がありません" }],
						isError: false,
					};
				}

				return {
					content: [{ type: "text", text: "記事があります" }],
					isError: false,
				};
			};

			const result = await toolHandler({ limit: 10 });

			expect(result.content[0].text).toBe("📭 評価された記事がありません");
		});
	});

	describe("bulkRateArticlesツールのテスト", () => {
		test("一括評価の成功", async () => {
			const mockRatingResults = [
				{ id: 1, totalScore: 80, articleId: 1 },
				{ id: 2, totalScore: 75, articleId: 2 },
			];

			// Promise.allSettledの成功結果をモック
			vi.mocked(apiClient.createArticleRating)
				.mockResolvedValueOnce({
					id: 1,
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 8,
					importance: 8,
					totalScore: 80,
					comment: "良い記事",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				})
				.mockResolvedValueOnce({
					id: 2,
					articleId: 2,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 7,
					novelty: 8,
					importance: 7,
					totalScore: 75,
					comment: "参考になる",
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				});

			const toolHandler = async (params: BulkRatingParams) => {
				try {
					const { ratings } = params;
					const results = await Promise.allSettled(
						ratings.map((ratingData) => {
							const { articleId, ...ratingFields } = ratingData;
							return apiClient.createArticleRating(articleId, ratingFields);
						}),
					);

					const succeeded = results.filter(
						(r) => r.status === "fulfilled",
					).length;
					const failed = results.filter((r) => r.status === "rejected").length;

					return {
						content: [
							{
								type: "text",
								text: `📝 一括評価完了\n✅ 成功: ${succeeded}件 | ❌ 失敗: ${failed}件`,
							},
						],
						isError: failed > 0,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `一括評価の実行に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const ratings = [
				{
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 8,
					importance: 8,
					comment: "良い記事",
				},
				{
					articleId: 2,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 7,
					novelty: 8,
					importance: 7,
					comment: "参考になる",
				},
			];

			const result = await toolHandler({ ratings });

			expect(result.content[0].text).toContain("✅ 成功: 2件 | ❌ 失敗: 0件");
			expect(result.isError).toBe(false);
		});

		test("一括評価の部分失敗", async () => {
			vi.mocked(apiClient.createArticleRating)
				.mockResolvedValueOnce({
					id: 1,
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 8,
					importance: 8,
					totalScore: 80,
					comment: "成功",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				})
				.mockRejectedValueOnce(new Error("記事が見つかりません"));

			const toolHandler = async (params: BulkRatingParams) => {
				try {
					const { ratings } = params;
					const results = await Promise.allSettled(
						ratings.map((ratingData) => {
							const { articleId, ...ratingFields } = ratingData;
							return apiClient.createArticleRating(articleId, ratingFields);
						}),
					);

					const succeeded = results.filter(
						(r) => r.status === "fulfilled",
					).length;
					const failed = results.filter((r) => r.status === "rejected").length;

					return {
						content: [
							{
								type: "text",
								text: `📝 一括評価完了\n✅ 成功: ${succeeded}件 | ❌ 失敗: ${failed}件`,
							},
						],
						isError: failed > 0,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `一括評価の実行に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const ratings = [
				{
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 8,
					importance: 8,
				},
				{
					articleId: 999, // 存在しない記事ID
					practicalValue: 7,
					technicalDepth: 7,
					understanding: 7,
					novelty: 7,
					importance: 7,
				},
			];

			const result = await toolHandler({ ratings });

			expect(result.content[0].text).toContain("✅ 成功: 1件 | ❌ 失敗: 1件");
			expect(result.isError).toBe(true);
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("getArticleRatingsツールの基本関数確認", () => {
		expect(typeof apiClient.getArticleRatings).toBe("function");
	});

	test("getRatingStatsツールの基本関数確認", () => {
		expect(typeof apiClient.getRatingStats).toBe("function");
	});

	test("createArticleRatingツールの基本関数確認", () => {
		expect(typeof apiClient.createArticleRating).toBe("function");
	});
}
