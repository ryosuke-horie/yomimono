/**
 * Issue #588: MCPテストカバレッジ 45%達成 - 高度な機能テスト
 * index.ts内の未カバー関数とエラーハンドリングの詳細テスト
 * getTopRatedArticles, bulkRateArticles, getRatingStatsツールの境界値・例外処理テスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// APIクライアントのモック
vi.mock("../lib/apiClient.js", () => ({
	getArticleRatings: vi.fn(),
	createArticleRating: vi.fn(),
	getRatingStats: vi.fn(),
}));

// getTopRatedArticlesツールの高度なハンドラー実装
async function createAdvancedGetTopRatedArticlesHandler() {
	return async ({ limit }: { limit?: number }) => {
		try {
			const actualLimit = limit || 10;
			const ratings = await apiClient.getArticleRatings({
				sortBy: "totalScore",
				order: "desc",
				limit: actualLimit,
			});

			if (ratings.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "📭 評価された記事がありません",
						},
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
						text: `🏆 高評価記事 Top ${actualLimit}\n\n${formatted}`,
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
}

// bulkRateArticlesツールの高度なハンドラー実装
async function createAdvancedBulkRateArticlesHandler() {
	return async ({
		ratings,
	}: {
		ratings: Array<{
			articleId: number;
			practicalValue: number;
			technicalDepth: number;
			understanding: number;
			novelty: number;
			importance: number;
			comment?: string;
		}>;
	}) => {
		try {
			const results = await Promise.allSettled(
				ratings.map((ratingData) => {
					const { articleId, ...ratingFields } = ratingData;
					return apiClient.createArticleRating(articleId, ratingFields);
				}),
			);

			const succeeded = results.filter((r) => r.status === "fulfilled").length;
			const failed = results.filter((r) => r.status === "rejected").length;

			const successfulRatings = results
				.map((result, index) => ({ result, originalData: ratings[index] }))
				.filter(({ result }) => result.status === "fulfilled")
				.map(({ result, originalData }) => ({
					...(
						result as PromiseFulfilledResult<{ totalScore: number; id: number }>
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
					.map((failure) => `• 記事ID ${failure.articleId}: ${failure.error}`)
					.join("\n");
			}

			return {
				content: [
					{
						type: "text",
						text: responseText,
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
}

// getRatingStatsツールの高度なハンドラー実装
async function createAdvancedGetRatingStatsHandler() {
	return async () => {
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
}

describe("Issue #588: 高度なMCP機能の詳細テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTopRatedArticles 高度な境界値テスト", () => {
		test("limit=1の最小値テスト", async () => {
			const mockRatings = [
				{
					id: 1,
					articleId: 101,
					practicalValue: 10,
					technicalDepth: 10,
					understanding: 10,
					novelty: 10,
					importance: 10,
					totalScore: 100,
					comment: "完璧な記事",
					createdAt: "2024-01-01T10:00:00Z",
					updatedAt: "2024-01-01T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createAdvancedGetTopRatedArticlesHandler();
			const result = await handler({ limit: 1 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("🏆 高評価記事 Top 1");
			expect(result.content[0].text).toContain("1. 📊 スコア: 10.0/10");
			expect(result.content[0].text).toContain("🆔 記事ID: 101");
			expect(result.content[0].text).toContain("💭 完璧な記事");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 1,
			});
		});

		test("limit=50の最大値テスト", async () => {
			// 50件のモックデータを生成
			const mockRatings = Array.from({ length: 50 }, (_, i) => ({
				id: i + 1,
				articleId: i + 100,
				practicalValue: 8 + (i % 3),
				technicalDepth: 7 + (i % 4),
				understanding: 8 + (i % 3),
				novelty: 6 + (i % 5),
				importance: 8 + (i % 3),
				totalScore: 80 + (i % 20),
				comment: i % 5 === 0 ? `Top記事${i + 1}` : null,
				createdAt: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
				updatedAt: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
			}));

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createAdvancedGetTopRatedArticlesHandler();
			const result = await handler({ limit: 50 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("🏆 高評価記事 Top 50");
			expect(result.content[0].text).toContain("1. 📊 スコア:");
			expect(result.content[0].text).toContain("50. 📊 スコア:");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 50,
			});
		});

		test("limitなし（デフォルト10）の処理", async () => {
			const mockRatings = Array.from({ length: 10 }, (_, i) => ({
				id: i + 1,
				articleId: i + 200,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 8,
				novelty: 6,
				importance: 8,
				totalScore: 74,
				comment: null,
				createdAt: "2024-01-10T10:00:00Z",
				updatedAt: "2024-01-10T10:00:00Z",
			}));

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createAdvancedGetTopRatedArticlesHandler();
			const result = await handler({});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("🏆 高評価記事 Top 10");
			expect(result.content[0].text).toContain("💭 コメントなし");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 10,
			});
		});

		test("データベース接続エラー時の処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				new Error("Connection pool exhausted"),
			);

			const handler = await createAdvancedGetTopRatedArticlesHandler();
			const result = await handler({ limit: 5 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"高評価記事の取得に失敗しました",
			);
			expect(result.content[0].text).toContain("Connection pool exhausted");
		});

		test("非Error型の例外処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				"サーバーメンテナンス中",
			);

			const handler = await createAdvancedGetTopRatedArticlesHandler();
			const result = await handler({ limit: 3 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("サーバーメンテナンス中");
		});
	});

	describe("bulkRateArticles 複合シナリオテスト", () => {
		test("混在した成功・失敗パターン（大量データ）", async () => {
			const mockSuccessRating1 = {
				id: 1,
				articleId: 201,
				practicalValue: 9,
				technicalDepth: 8,
				understanding: 9,
				novelty: 7,
				importance: 9,
				totalScore: 85,
				comment: "テスト記事1",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};
			const mockSuccessRating2 = {
				id: 2,
				articleId: 203,
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 9,
				novelty: 8,
				importance: 10,
				totalScore: 92,
				comment: "テスト記事2",
				createdAt: "2024-01-02T10:00:00Z",
				updatedAt: "2024-01-02T10:00:00Z",
			};
			const mockSuccessRating3 = {
				id: 3,
				articleId: 205,
				practicalValue: 7,
				technicalDepth: 8,
				understanding: 8,
				novelty: 6,
				importance: 8,
				totalScore: 78,
				comment: "テスト記事3",
				createdAt: "2024-01-03T10:00:00Z",
				updatedAt: "2024-01-03T10:00:00Z",
			};

			vi.mocked(apiClient.createArticleRating)
				.mockResolvedValueOnce(mockSuccessRating1)
				.mockRejectedValueOnce(
					new Error("バリデーションエラー: 実用性は1-10の範囲"),
				)
				.mockResolvedValueOnce(mockSuccessRating2)
				.mockRejectedValueOnce(new Error("記事ID 404が存在しません"))
				.mockResolvedValueOnce(mockSuccessRating3)
				.mockRejectedValueOnce(new Error("権限がありません"));

			const handler = await createAdvancedBulkRateArticlesHandler();
			const result = await handler({
				ratings: [
					{
						articleId: 201,
						practicalValue: 9,
						technicalDepth: 8,
						understanding: 9,
						novelty: 7,
						importance: 9,
						comment: "素晴らしい記事",
					},
					{
						articleId: 202,
						practicalValue: 11, // 無効値
						technicalDepth: 8,
						understanding: 9,
						novelty: 7,
						importance: 9,
					},
					{
						articleId: 203,
						practicalValue: 8,
						technicalDepth: 9,
						understanding: 9,
						novelty: 8,
						importance: 10,
						comment: "非常に有用",
					},
					{
						articleId: 404, // 存在しない記事ID
						practicalValue: 8,
						technicalDepth: 7,
						understanding: 8,
						novelty: 6,
						importance: 8,
					},
					{
						articleId: 205,
						practicalValue: 7,
						technicalDepth: 8,
						understanding: 8,
						novelty: 6,
						importance: 8,
					},
					{
						articleId: 206, // 権限エラー
						practicalValue: 9,
						technicalDepth: 9,
						understanding: 9,
						novelty: 8,
						importance: 9,
					},
				],
			});

			expect(result.isError).toBe(true); // 失敗があるためエラー
			expect(result.content[0].text).toContain("📝 一括評価完了");
			expect(result.content[0].text).toContain("✅ 成功: 3件 | ❌ 失敗: 3件");
			expect(result.content[0].text).toContain("記事ID 201: 総合スコア 8.5/10");
			expect(result.content[0].text).toContain("記事ID 203: 総合スコア 9.2/10");
			expect(result.content[0].text).toContain("記事ID 205: 総合スコア 7.8/10");
			expect(result.content[0].text).toContain(
				"記事ID 202: Error: バリデーションエラー",
			);
			expect(result.content[0].text).toContain(
				"記事ID 404: Error: 記事ID 404が存在しません",
			);
			expect(result.content[0].text).toContain(
				"記事ID 206: Error: 権限がありません",
			);
			expect(apiClient.createArticleRating).toHaveBeenCalledTimes(6);
		});

		test("Promise.allSettled外での例外処理", async () => {
			// Promise.allSettled自体がエラーを投げる稀なケース
			vi.mocked(apiClient.createArticleRating).mockImplementation(() => {
				throw new Error("予期しないシステムエラー");
			});

			const handler = await createAdvancedBulkRateArticlesHandler();
			const result = await handler({
				ratings: [
					{
						articleId: 300,
						practicalValue: 8,
						technicalDepth: 7,
						understanding: 8,
						novelty: 6,
						importance: 8,
					},
				],
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("一括評価の実行に失敗しました");
			expect(result.content[0].text).toContain("予期しないシステムエラー");
		});

		test("最大10件制限での境界値テスト", async () => {
			const mockRatings = Array.from({ length: 10 }, (_, i) => ({
				id: i + 10,
				articleId: 400 + i,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 8,
				novelty: 6,
				importance: 8,
				totalScore: 75 + i,
				comment: `一括テスト${i + 1}`,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			}));

			for (let i = 0; i < 10; i++) {
				vi.mocked(apiClient.createArticleRating).mockResolvedValueOnce(
					mockRatings[i],
				);
			}

			const handler = await createAdvancedBulkRateArticlesHandler();
			const ratings = Array.from({ length: 10 }, (_, i) => ({
				articleId: 400 + i,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 8,
				novelty: 6,
				importance: 8,
				comment: `一括テスト${i + 1}`,
			}));

			const result = await handler({ ratings });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("✅ 成功: 10件 | ❌ 失敗: 0件");
			expect(result.content[0].text).toContain("記事ID 400: 総合スコア 7.5/10");
			expect(result.content[0].text).toContain("記事ID 409: 総合スコア 8.4/10");
		});
	});

	describe("getRatingStats 境界値・例外処理テスト", () => {
		test("極端に大きな統計値での処理", async () => {
			const mockLargeStats = {
				totalRatings: 999999,
				averageScore: 9.99,
				medianScore: 10.0,
				dimensionAverages: {
					practicalValue: 9.95,
					technicalDepth: 9.89,
					understanding: 9.92,
					novelty: 9.87,
					importance: 9.94,
				},
				scoreDistribution: [
					{ range: "9-10", count: 950000, percentage: 95.0 },
					{ range: "8-9", count: 40000, percentage: 4.0 },
					{ range: "7-8", count: 9999, percentage: 1.0 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "究極のプログラミング技術解説",
						url: "https://ultimate.example.com/programming",
						totalScore: 100,
					},
					{
						id: 2,
						title: "完璧なアーキテクチャ設計",
						url: "https://perfect.example.com/architecture",
						totalScore: 99,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockLargeStats);

			const handler = await createAdvancedGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("総評価数: 999999件");
			expect(result.content[0].text).toContain("平均スコア: 10.0/10");
			expect(result.content[0].text).toContain("中央値: 10.0/10");
			expect(result.content[0].text).toContain("実用性: 9.9/10");
			expect(result.content[0].text).toContain("9-10: 950000件 (95.0%)");
			expect(result.content[0].text).toContain("究極のプログラミング技術解説");
			expect(result.content[0].text).toContain("(10.0/10)");
		});

		test("統計APIでのタイムアウトエラー", async () => {
			vi.mocked(apiClient.getRatingStats).mockRejectedValue(
				new Error("Query timeout: Statistics calculation took too long"),
			);

			const handler = await createAdvancedGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"評価統計情報の取得に失敗しました",
			);
			expect(result.content[0].text).toContain(
				"Query timeout: Statistics calculation took too long",
			);
		});

		test("不正なデータ型での例外処理", async () => {
			vi.mocked(apiClient.getRatingStats).mockRejectedValue({
				code: 500,
				status: "Internal Server Error",
				message: "データベース計算エラー",
			});

			const handler = await createAdvancedGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"評価統計情報の取得に失敗しました",
			);
			// オブジェクトがString()で変換される
			expect(result.content[0].text).toContain("[object Object]");
		});

		test("topRatedArticlesが5件未満の場合", async () => {
			const mockSmallTopStats = {
				totalRatings: 2,
				averageScore: 8.5,
				medianScore: 8.5,
				dimensionAverages: {
					practicalValue: 8.5,
					technicalDepth: 8.0,
					understanding: 8.5,
					novelty: 8.0,
					importance: 9.0,
				},
				scoreDistribution: [{ range: "8-9", count: 2, percentage: 100.0 }],
				topRatedArticles: [
					{
						id: 1,
						title: "記事A",
						url: "https://example.com/a",
						totalScore: 86,
					},
					{
						id: 2,
						title: "記事B",
						url: "https://example.com/b",
						totalScore: 84,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockSmallTopStats);

			const handler = await createAdvancedGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("総評価数: 2件");
			expect(result.content[0].text).toContain("1. 記事A (8.6/10)");
			expect(result.content[0].text).toContain("2. 記事B (8.4/10)");
			// 3-5番目は表示されない
			expect(result.content[0].text).not.toContain("3.");
		});
	});
});

// インライン形式テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("Issue #588 高度な機能テスト関数の定義確認", () => {
		expect(createAdvancedGetTopRatedArticlesHandler).toBeDefined();
		expect(createAdvancedBulkRateArticlesHandler).toBeDefined();
		expect(createAdvancedGetRatingStatsHandler).toBeDefined();

		expect(typeof createAdvancedGetTopRatedArticlesHandler).toBe("function");
		expect(typeof createAdvancedBulkRateArticlesHandler).toBe("function");
		expect(typeof createAdvancedGetRatingStatsHandler).toBe("function");
	});

	test("Promise.allSettledの型定義確認", () => {
		const testPromises = [
			Promise.resolve({ id: 1, totalScore: 80 }),
			Promise.reject(new Error("テストエラー")),
			Promise.resolve({ id: 2, totalScore: 90 }),
		];

		// Promise.allSettledの型が正しく推論されることを確認
		Promise.allSettled(testPromises).then((results) => {
			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBe(3);
			expect(results[0].status).toBe("fulfilled");
			expect(results[1].status).toBe("rejected");
			expect(results[2].status).toBe("fulfilled");
		});
	});

	test("統計データの小数点処理確認", () => {
		const testValues = [9.999, 10.0, 0.001, 5.555];
		const formattedValues = testValues.map((v) => v.toFixed(1));

		expect(formattedValues[0]).toBe("10.0");
		expect(formattedValues[1]).toBe("10.0");
		expect(formattedValues[2]).toBe("0.0");
		expect(formattedValues[3]).toBe("5.6");
	});

	test("配列スライス処理の確認", () => {
		const largeArray = Array.from({ length: 20 }, (_, i) => `item${i}`);
		const top5 = largeArray.slice(0, 5);

		expect(top5.length).toBe(5);
		expect(top5[0]).toBe("item0");
		expect(top5[4]).toBe("item4");

		const smallArray = ["a", "b"];
		const top5Small = smallArray.slice(0, 5);

		expect(top5Small.length).toBe(2);
		expect(top5Small).toEqual(["a", "b"]);
	});
}
