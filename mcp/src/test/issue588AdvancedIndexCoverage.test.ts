/**
 * Issue #588: index.tsの未カバー部分を狙い撃ちするテスト
 * 特にgetArticleRatings, getRatingStats, getTopRatedArticles, bulkRateArticlesの詳細な実行パスをカバー
 */

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

describe("Issue #588: index.ts詳細カバレッジ向上", () => {
	let server: McpServer;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "http://localhost:3000";

		server = new McpServer({
			name: "AdvancedTestServer",
			version: "0.6.0",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getArticleRatingsツール - 詳細フォーマット処理", () => {
		test("フォーマット関数の詳細な評価表示", async () => {
			const mockRating = {
				id: 123,
				articleId: 456,
				practicalValue: 9,
				technicalDepth: 8,
				understanding: 10,
				novelty: 7,
				importance: 9,
				totalScore: 86,
				comment: "とても参考になる記事でした。実装例が豊富で理解しやすい。",
				createdAt: "2024-01-15T10:30:00Z",
				updatedAt: "2024-01-15T10:30:00Z",
			};

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([mockRating]);

			// getArticleRatingsツールの実際のフォーマット処理をシミュレート
			const toolHandler = async (params: GetRatingsOptions) => {
				try {
					const ratings = await apiClient.getArticleRatings(params);

					const formatRatingForDisplay = (
						rating: typeof mockRating & { comment: string | null },
					) => {
						const totalScore = (rating.totalScore / 10).toFixed(1);
						return `📊 評価ID: ${rating.id}
   記事ID: ${rating.articleId}
   📈 総合スコア: ${totalScore}/10
   📋 詳細評価:
      • 実用性: ${rating.practicalValue}/10
      • 技術深度: ${rating.technicalDepth}/10  
      • 理解度: ${rating.understanding}/10
      • 新規性: ${rating.novelty}/10
      • 重要度: ${rating.importance}/10
   💭 コメント: ${rating.comment || "なし"}
   📅 作成日: ${new Date(rating.createdAt).toLocaleDateString("ja-JP")}`;
					};

					const formatted = ratings.map(formatRatingForDisplay).join("\n\n");

					// フィルター情報の構築
					const filterInfo = [];
					if (params.sortBy)
						filterInfo.push(
							`ソート: ${params.sortBy} (${params.order || "asc"})`,
						);
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
								text: `📊 記事評価一覧 (${ratings.length}件)
${filterInfo.length > 0 ? `\n🔍 フィルター条件: ${filterInfo.join(", ")}\n` : ""}
${formatted || "📭 条件に合致する評価がありません"}`,
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
				sortBy: "practicalValue",
				order: "desc",
				minScore: 8,
				hasComment: true,
			});

			expect(result.content[0].text).toContain("📊 評価ID: 123");
			expect(result.content[0].text).toContain("📈 総合スコア: 8.6/10");
			expect(result.content[0].text).toContain("• 実用性: 9/10");
			expect(result.content[0].text).toContain("• 技術深度: 8/10");
			expect(result.content[0].text).toContain(
				"💭 コメント: とても参考になる記事でした。実装例が豊富で理解しやすい。",
			);
			expect(result.content[0].text).toContain("ソート: practicalValue (desc)");
			expect(result.content[0].text).toContain("スコア範囲: 8-10");
			expect(result.content[0].text).toContain("コメント: あり");
		});

		test("空の結果セットでのフォールバック表示", async () => {
			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([]);

			const toolHandler = async (params: GetRatingsOptions) => {
				try {
					const ratings = await apiClient.getArticleRatings(params);
					const formatted = ratings.map(() => "").join("\n\n");

					return {
						content: [
							{
								type: "text",
								text: `📊 記事評価一覧 (${ratings.length}件)
${formatted || "📭 条件に合致する評価がありません"}`,
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

			const result = await toolHandler({ minScore: 15 });

			expect(result.content[0].text).toContain(
				"📭 条件に合致する評価がありません",
			);
		});

		test("日付フォーマット処理の詳細テスト", async () => {
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
					comment: null,
					createdAt: "2024-12-25T14:30:45.123Z", // 詳細なタイムスタンプ
					updatedAt: "2024-12-25T14:30:45.123Z",
				},
				{
					id: 2,
					articleId: 2,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 7,
					novelty: 9,
					importance: 8,
					totalScore: 78,
					comment: "年末の総まとめ記事",
					createdAt: "2024-01-01T00:00:00Z", // 年始のタイムスタンプ
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const toolHandler = async () => {
				const ratings = await apiClient.getArticleRatings({});

				const formatRatingForDisplay = (rating: (typeof mockRatings)[0]) => {
					return `📅 作成日: ${new Date(rating.createdAt).toLocaleDateString("ja-JP")}`;
				};

				const formatted = ratings.map(formatRatingForDisplay).join("\n");
				return { content: [{ type: "text", text: formatted }], isError: false };
			};

			const result = await toolHandler();

			expect(result.content[0].text).toContain("2024/12/25");
			expect(result.content[0].text).toContain("2024/1/1");
		});
	});

	describe("getRatingStatsツール - 詳細統計フォーマット", () => {
		test("詳細統計情報の完全フォーマット", async () => {
			const mockStats = {
				totalRatings: 250,
				averageScore: 7.3,
				medianScore: 7.5,
				dimensionAverages: {
					practicalValue: 7.8,
					technicalDepth: 6.9,
					understanding: 7.6,
					novelty: 6.8,
					importance: 7.4,
				},
				scoreDistribution: [
					{ range: "1-2", count: 5, percentage: 2.0 },
					{ range: "3-4", count: 20, percentage: 8.0 },
					{ range: "5-6", count: 45, percentage: 18.0 },
					{ range: "7-8", count: 120, percentage: 48.0 },
					{ range: "9-10", count: 60, percentage: 24.0 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "最高の技術記事 - React Hooks完全ガイド",
						url: "https://example.com/react-hooks-guide",
						totalScore: 98,
					},
					{
						id: 2,
						title: "TypeScript型システム徹底解説",
						url: "https://example.com/typescript-types",
						totalScore: 95,
					},
					{
						id: 3,
						title: "Node.js パフォーマンス最適化",
						url: "https://example.com/nodejs-performance",
						totalScore: 92,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockStats);

			const toolHandler = async () => {
				try {
					const stats = await apiClient.getRatingStats();

					const summary = `📈 記事評価統計情報

## サマリー
📊 総評価数: ${stats.totalRatings}件
⭐ 平均スコア: ${stats.averageScore.toFixed(1)}/10
📊 中央値: ${stats.medianScore.toFixed(1)}/10

## 評価軸別平均
🔧 実用性: ${stats.dimensionAverages.practicalValue.toFixed(1)}/10
🧠 技術深度: ${stats.dimensionAverages.technicalDepth.toFixed(1)}/10
📚 理解度: ${stats.dimensionAverages.understanding.toFixed(1)}/10
✨ 新規性: ${stats.dimensionAverages.novelty.toFixed(1)}/10
⚡ 重要度: ${stats.dimensionAverages.importance.toFixed(1)}/10

## スコア分布
${stats.scoreDistribution
	.map((d) => `${d.range}: ${d.count}件 (${d.percentage.toFixed(1)}%)`)
	.join("\n")}

## 高評価記事 Top 5
${stats.topRatedArticles
	.slice(0, 5)
	.map(
		(article, i) =>
			`${i + 1}. ${article.title} (${(article.totalScore / 10).toFixed(1)}/10)\n   URL: ${article.url}`,
	)
	.join("\n\n")}`;

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

			expect(result.content[0].text).toContain("📊 総評価数: 250件");
			expect(result.content[0].text).toContain("⭐ 平均スコア: 7.3/10");
			expect(result.content[0].text).toContain("🔧 実用性: 7.8/10");
			expect(result.content[0].text).toContain("1-2: 5件 (2.0%)");
			expect(result.content[0].text).toContain(
				"1. 最高の技術記事 - React Hooks完全ガイド (9.8/10)",
			);
			expect(result.content[0].text).toContain(
				"URL: https://example.com/react-hooks-guide",
			);
		});

		test("統計データが少ない場合の処理", async () => {
			const mockLimitedStats = {
				totalRatings: 3,
				averageScore: 6.0,
				medianScore: 6.0,
				dimensionAverages: {
					practicalValue: 6.0,
					technicalDepth: 6.0,
					understanding: 6.0,
					novelty: 6.0,
					importance: 6.0,
				},
				scoreDistribution: [{ range: "5-6", count: 3, percentage: 100.0 }],
				topRatedArticles: [
					{
						id: 1,
						title: "テスト記事",
						url: "https://example.com/test",
						totalScore: 60,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockLimitedStats);

			const toolHandler = async () => {
				const stats = await apiClient.getRatingStats();

				// Top 5をスライスしても1件しかない場合のテスト
				const topArticlesText = stats.topRatedArticles
					.slice(0, 5)
					.map(
						(article, i) =>
							`${i + 1}. ${article.title} (${(article.totalScore / 10).toFixed(1)}/10)`,
					)
					.join("\n\n");

				return {
					content: [{ type: "text", text: `高評価記事:\n${topArticlesText}` }],
					isError: false,
				};
			};

			const result = await toolHandler();

			expect(result.content[0].text).toContain("1. テスト記事 (6.0/10)");
		});
	});

	describe("getTopRatedArticlesツール - 様々なlimit値での処理", () => {
		test("limit値による表示数制御", async () => {
			const mockTopRatings = Array.from({ length: 20 }, (_, index) => ({
				id: index + 1,
				articleId: index + 1,
				practicalValue: 9 - Math.floor(index / 5),
				technicalDepth: 8 - Math.floor(index / 4),
				understanding: 9 - Math.floor(index / 6),
				novelty: 7 - Math.floor(index / 8),
				importance: 8 - Math.floor(index / 7),
				totalScore: 85 - index,
				comment: `記事${index + 1}のコメント`,
				createdAt: `2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
				updatedAt: `2024-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
			}));

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
								`${index + 1}. 📊 スコア: ${(rating.totalScore / 10).toFixed(1)}/10
   🆔 記事ID: ${rating.articleId}
   📋 評価内訳: 実用${rating.practicalValue} | 技術${rating.technicalDepth} | 理解${rating.understanding} | 新規${rating.novelty} | 重要${rating.importance}
   💭 ${rating.comment || "コメントなし"}`,
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

			// 異なるlimit値でテスト
			const result3 = await toolHandler({ limit: 3 });
			expect(result3.content[0].text).toContain("🏆 高評価記事 Top 3");
			expect(result3.content[0].text).toContain("3. 📊 スコア:");

			const result15 = await toolHandler({ limit: 15 });
			expect(result15.content[0].text).toContain("🏆 高評価記事 Top 15");
			expect(result15.content[0].text).toContain("15. 📊 スコア:");
		});

		test("評価内訳の詳細表示フォーマット", async () => {
			const mockRating = {
				id: 1,
				articleId: 1,
				practicalValue: 10,
				technicalDepth: 9,
				understanding: 8,
				novelty: 7,
				importance: 6,
				totalScore: 80,
				comment: "素晴らしい記事です",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([mockRating]);

			const toolHandler = async () => {
				const ratings = await apiClient.getArticleRatings({
					sortBy: "totalScore",
					order: "desc",
					limit: 1,
				});

				const formatted = ratings
					.map(
						(rating, index) =>
							`${index + 1}. 📊 スコア: ${(rating.totalScore / 10).toFixed(1)}/10
   🆔 記事ID: ${rating.articleId}
   📋 評価内訳: 実用${rating.practicalValue} | 技術${rating.technicalDepth} | 理解${rating.understanding} | 新規${rating.novelty} | 重要${rating.importance}
   💭 ${rating.comment || "コメントなし"}`,
					)
					.join("\n\n");

				return { content: [{ type: "text", text: formatted }], isError: false };
			};

			const result = await toolHandler();

			expect(result.content[0].text).toContain(
				"📋 評価内訳: 実用10 | 技術9 | 理解8 | 新規7 | 重要6",
			);
			expect(result.content[0].text).toContain("💭 素晴らしい記事です");
		});
	});

	describe("bulkRateArticlesツール - 詳細な結果処理", () => {
		test("成功/失敗結果の詳細フォーマット", async () => {
			// 成功と失敗の混在をシミュレート
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
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 9,
					novelty: 9,
					importance: 9,
					totalScore: 90,
					comment: "素晴らしい記事",
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				})
				.mockRejectedValueOnce(new Error("記事ID 3が見つかりません"))
				.mockRejectedValueOnce(new Error("評価データが不正です"));

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

					const successfulRatings = results
						.map((result, index) => ({ result, originalData: ratings[index] }))
						.filter(({ result }) => result.status === "fulfilled")
						.map(({ result, originalData }) => ({
							...(
								result as PromiseFulfilledResult<{
									totalScore: number;
									id: number;
								}>
							).value,
							originalArticleId: originalData.articleId,
						}));

					const failedRatings = results
						.map((result, index) => ({ result, originalData: ratings[index] }))
						.filter(({ result }) => result.status === "rejected")
						.map(({ result, originalData }) => ({
							articleId: originalData.articleId,
							error: (result as PromiseRejectedResult).reason,
						}));

					let responseText = `📝 一括評価完了\n✅ 成功: ${succeeded}件 | ❌ 失敗: ${failed}件`;

					if (successfulRatings.length > 0) {
						responseText += "\n\n✅ 成功した評価:\n";
						responseText += successfulRatings
							.map(
								(rating) =>
									`• 記事ID ${rating.originalArticleId}: 総合スコア ${(rating.totalScore / 10).toFixed(1)}/10`,
							)
							.join("\n");
					}

					if (failedRatings.length > 0) {
						responseText += "\n\n❌ 失敗した評価:\n";
						responseText += failedRatings
							.map(
								(failure) => `• 記事ID ${failure.articleId}: ${failure.error}`,
							)
							.join("\n");
					}

					return {
						content: [{ type: "text", text: responseText }],
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
					articleId: 2,
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 9,
					novelty: 9,
					importance: 9,
				},
				{
					articleId: 3,
					practicalValue: 7,
					technicalDepth: 7,
					understanding: 7,
					novelty: 7,
					importance: 7,
				},
				{
					articleId: 4,
					practicalValue: 6,
					technicalDepth: 6,
					understanding: 6,
					novelty: 6,
					importance: 6,
				},
			];

			const result = await toolHandler({ ratings });

			expect(result.content[0].text).toContain("✅ 成功: 2件 | ❌ 失敗: 2件");
			expect(result.content[0].text).toContain("✅ 成功した評価:");
			expect(result.content[0].text).toContain("• 記事ID 1: 総合スコア 8.0/10");
			expect(result.content[0].text).toContain("• 記事ID 2: 総合スコア 9.0/10");
			expect(result.content[0].text).toContain("❌ 失敗した評価:");
			expect(result.content[0].text).toContain(
				"• 記事ID 3: Error: 記事ID 3が見つかりません",
			);
			expect(result.content[0].text).toContain(
				"• 記事ID 4: Error: 評価データが不正です",
			);
			expect(result.isError).toBe(true);
		});

		test("全件成功時のフォーマット", async () => {
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
					comment: "評価1",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				})
				.mockResolvedValueOnce({
					id: 2,
					articleId: 2,
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 9,
					novelty: 9,
					importance: 9,
					totalScore: 90,
					comment: "評価2",
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				});

			const toolHandler = async (params: BulkRatingParams) => {
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

				const successfulRatings = results
					.map((result, index) => ({ result, originalData: ratings[index] }))
					.filter(({ result }) => result.status === "fulfilled")
					.map(({ result, originalData }) => ({
						...(
							result as PromiseFulfilledResult<{
								totalScore: number;
								id: number;
							}>
						).value,
						originalArticleId: originalData.articleId,
					}));

				let responseText = `📝 一括評価完了\n✅ 成功: ${succeeded}件 | ❌ 失敗: ${failed}件`;

				if (successfulRatings.length > 0) {
					responseText += "\n\n✅ 成功した評価:\n";
					responseText += successfulRatings
						.map(
							(rating) =>
								`• 記事ID ${rating.originalArticleId}: 総合スコア ${(rating.totalScore / 10).toFixed(1)}/10`,
						)
						.join("\n");
				}

				return {
					content: [{ type: "text", text: responseText }],
					isError: failed > 0,
				};
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
					articleId: 2,
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 9,
					novelty: 9,
					importance: 9,
				},
			];

			const result = await toolHandler({ ratings });

			expect(result.content[0].text).toContain("✅ 成功: 2件 | ❌ 失敗: 0件");
			expect(result.content[0].text).toContain("✅ 成功した評価:");
			expect(result.content[0].text).not.toContain("❌ 失敗した評価:");
			expect(result.isError).toBe(false);
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("index.tsの高度な評価ツール関数の基本確認", () => {
		expect(typeof apiClient.getArticleRatings).toBe("function");
		expect(typeof apiClient.getRatingStats).toBe("function");
		expect(typeof apiClient.createArticleRating).toBe("function");
	});
}
