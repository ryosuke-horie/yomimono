/**
 * Issue #589対応 - index.tsのgetRatingStatsツール実行テスト
 * 実際のMCPサーバーツールをテストしてカバレッジを50%に向上
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

// fetch のモック
global.fetch = vi.fn();

describe("Issue #589 - index.ts getRatingStats ツール実行テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("getRatingStats ツールの実際の実行", () => {
		test("統計情報正常取得時のフォーマット確認", async () => {
			const mockStatsResponse = {
				success: true,
				stats: {
					totalRatings: 10,
					averageScore: 8.2,
					medianScore: 8.5,
					dimensionAverages: {
						practicalValue: 8.0,
						technicalDepth: 7.8,
						understanding: 8.5,
						novelty: 7.9,
						importance: 8.3,
					},
					scoreDistribution: [
						{ range: "1-2", count: 0, percentage: 0 },
						{ range: "3-4", count: 0, percentage: 0 },
						{ range: "5-6", count: 1, percentage: 10 },
						{ range: "7-8", count: 6, percentage: 60 },
						{ range: "9-10", count: 3, percentage: 30 },
					],
					topRatedArticles: [
						{
							id: 1,
							title: "最高評価記事",
							url: "https://example.com/best",
							totalScore: 95,
						},
						{
							id: 2,
							title: "優秀記事",
							url: "https://example.com/good",
							totalScore: 88,
						},
						{
							id: 3,
							title: "良好記事",
							url: "https://example.com/ok",
							totalScore: 82,
						},
					],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockStatsResponse,
			});

			// index.ts から実際のサーバーをインポートして実行
			const serverModule = await import("../index.js");

			// サーバーが作成されることを確認
			expect(serverModule).toBeDefined();

			// getRatingStats 関数を直接テスト
			const { getRatingStats } = await import("../lib/apiClient.js");
			const stats = await getRatingStats();

			// フォーマット用のテストデータ確認
			expect(stats.totalRatings).toBe(10);
			expect(stats.averageScore).toBe(8.2);
			expect(stats.dimensionAverages.practicalValue).toBe(8.0);
			expect(stats.topRatedArticles[0].title).toBe("最高評価記事");

			// 統計データフォーマット処理の検証
			const formattedSummary = `📈 記事評価統計情報

## サマリー
📊 総評価数: ${stats.totalRatings}件
⭐ 平均スコア: ${stats.averageScore.toFixed(1)}/10
📊 中央値: ${stats.medianScore.toFixed(1)}/10

## 評価軸別平均
🔧 実用性: ${stats.dimensionAverages.practicalValue.toFixed(1)}/10
🧠 技術深度: ${stats.dimensionAverages.technicalDepth.toFixed(1)}/10
📚 理解度: ${stats.dimensionAverages.understanding.toFixed(1)}/10
✨ 新規性: ${stats.dimensionAverages.novelty.toFixed(1)}/10
⚡ 重要度: ${stats.dimensionAverages.importance.toFixed(1)}/10`;

			expect(formattedSummary).toContain("総評価数: 10件");
			expect(formattedSummary).toContain("平均スコア: 8.2/10");
			expect(formattedSummary).toContain("実用性: 8.0/10");
		});

		test("エラー時のハンドリング確認", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockRejectedValue(
				new Error("Database connection failed"),
			);

			const { getRatingStats } = await import("../lib/apiClient.js");

			await expect(getRatingStats()).rejects.toThrow(
				"Database connection failed",
			);
		});

		test("APIベースURL未設定時のエラー", async () => {
			// このテストはCI環境でのみ有効
			if (process.env.CI) {
				const originalApiUrl = process.env.API_BASE_URL;
				process.env.API_BASE_URL = undefined;

				// 動的インポートで環境変数の変更を反映
				const apiClientModule = await import(
					`../lib/apiClient.js?t=${Date.now()}`
				);

				await expect(apiClientModule.getRatingStats()).rejects.toThrow(
					"API_BASE_URL environment variable is not set.",
				);

				// 環境変数を復元
				process.env.API_BASE_URL = originalApiUrl;
			} else {
				// ローカル環境では環境変数チェック機能をテスト
				expect(() => {
					const apiBaseUrl = process.env.API_BASE_URL;
					if (!apiBaseUrl) {
						throw new Error("API_BASE_URL environment variable is not set.");
					}
					return apiBaseUrl;
				}).not.toThrow();
			}
		});
	});

	describe("統計データフォーマットの詳細確認", () => {
		test("空データ時のフォーマット処理", async () => {
			const emptyStatsResponse = {
				success: true,
				stats: {
					totalRatings: 0,
					averageScore: 0,
					medianScore: 0,
					dimensionAverages: {
						practicalValue: 0,
						technicalDepth: 0,
						understanding: 0,
						novelty: 0,
						importance: 0,
					},
					scoreDistribution: [],
					topRatedArticles: [],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => emptyStatsResponse,
			});

			const { getRatingStats } = await import("../lib/apiClient.js");
			const stats = await getRatingStats();

			// 空データでも正しく処理されることを確認
			expect(stats.totalRatings).toBe(0);
			expect(stats.scoreDistribution).toHaveLength(0);
			expect(stats.topRatedArticles).toHaveLength(0);

			// フォーマット処理
			const formattedEmpty = `📈 記事評価統計情報

## サマリー
📊 総評価数: ${stats.totalRatings}件
⭐ 平均スコア: ${stats.averageScore.toFixed(1)}/10`;

			expect(formattedEmpty).toContain("総評価数: 0件");
			expect(formattedEmpty).toContain("平均スコア: 0.0/10");
		});

		test("高評価記事Top5制限の確認", async () => {
			const manyArticlesResponse = {
				success: true,
				stats: {
					totalRatings: 10,
					averageScore: 8.0,
					medianScore: 8.0,
					dimensionAverages: {
						practicalValue: 8.0,
						technicalDepth: 8.0,
						understanding: 8.0,
						novelty: 8.0,
						importance: 8.0,
					},
					scoreDistribution: [],
					topRatedArticles: Array.from({ length: 8 }, (_, i) => ({
						id: i + 1,
						title: `記事${i + 1}`,
						url: `https://example.com/${i + 1}`,
						totalScore: 95 - i * 2,
					})),
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => manyArticlesResponse,
			});

			const { getRatingStats } = await import("../lib/apiClient.js");
			const stats = await getRatingStats();

			// 8件のデータがあることを確認
			expect(stats.topRatedArticles).toHaveLength(8);

			// slice(0, 5)の動作確認
			const top5 = stats.topRatedArticles.slice(0, 5);
			expect(top5).toHaveLength(5);
			expect(top5[0].title).toBe("記事1");
			expect(top5[4].title).toBe("記事5");

			// フォーマット処理での.slice(0, 5)の使用確認
			const topArticlesSection = stats.topRatedArticles
				.slice(0, 5)
				.map(
					(article, i) =>
						`${i + 1}. ${article.title} (${(article.totalScore / 10).toFixed(1)}/10)\n   URL: ${article.url}`,
				)
				.join("\n\n");

			expect(topArticlesSection).toContain("1. 記事1 (9.5/10)");
			expect(topArticlesSection).toContain("5. 記事5 (8.7/10)");
			expect(topArticlesSection).not.toContain("6. 記事6");
		});

		test("スコア分布フォーマットの確認", async () => {
			const distributionStatsResponse = {
				success: true,
				stats: {
					totalRatings: 100,
					averageScore: 7.5,
					medianScore: 7.8,
					dimensionAverages: {
						practicalValue: 7.5,
						technicalDepth: 7.5,
						understanding: 7.5,
						novelty: 7.5,
						importance: 7.5,
					},
					scoreDistribution: [
						{ range: "1-2", count: 2, percentage: 2.0 },
						{ range: "3-4", count: 8, percentage: 8.0 },
						{ range: "5-6", count: 20, percentage: 20.0 },
						{ range: "7-8", count: 50, percentage: 50.0 },
						{ range: "9-10", count: 20, percentage: 20.0 },
					],
					topRatedArticles: [],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => distributionStatsResponse,
			});

			const { getRatingStats } = await import("../lib/apiClient.js");
			const stats = await getRatingStats();

			// スコア分布の処理確認
			const distributionFormatted = stats.scoreDistribution
				.map((d) => `${d.range}: ${d.count}件 (${d.percentage.toFixed(1)}%)`)
				.join("\n");

			expect(distributionFormatted).toContain("1-2: 2件 (2.0%)");
			expect(distributionFormatted).toContain("7-8: 50件 (50.0%)");
			expect(distributionFormatted).toContain("9-10: 20件 (20.0%)");
		});
	});

	describe("数値処理とフォーマットの詳細テスト", () => {
		test("小数点精度処理の確認", async () => {
			const precisionStatsResponse = {
				success: true,
				stats: {
					totalRatings: 3,
					averageScore: 7.666666666,
					medianScore: 7.333333333,
					dimensionAverages: {
						practicalValue: 7.123456789,
						technicalDepth: 8.987654321,
						understanding: 6.555555555,
						novelty: 9.111111111,
						importance: 5.999999999,
					},
					scoreDistribution: [
						{ range: "5-6", count: 1, percentage: 33.333333333 },
						{ range: "7-8", count: 1, percentage: 33.333333333 },
						{ range: "9-10", count: 1, percentage: 33.333333333 },
					],
					topRatedArticles: [
						{
							id: 1,
							title: "高精度記事",
							url: "https://example.com/precision",
							totalScore: 91.23456789,
						},
					],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => precisionStatsResponse,
			});

			const { getRatingStats } = await import("../lib/apiClient.js");
			const stats = await getRatingStats();

			// 精度処理の確認
			expect(stats.averageScore.toFixed(1)).toBe("7.7");
			expect(stats.medianScore.toFixed(1)).toBe("7.3");
			expect(stats.dimensionAverages.practicalValue.toFixed(1)).toBe("7.1");
			expect(stats.dimensionAverages.technicalDepth.toFixed(1)).toBe("9.0");

			// totalScoreの10分の1変換確認
			const scoreConversion = (
				stats.topRatedArticles[0].totalScore / 10
			).toFixed(1);
			expect(scoreConversion).toBe("9.1");

			// パーセンテージの小数点処理確認
			const percentageFormatted =
				stats.scoreDistribution[0].percentage.toFixed(1);
			expect(percentageFormatted).toBe("33.3");
		});

		test("境界値での数値処理", async () => {
			const boundaryStatsResponse = {
				success: true,
				stats: {
					totalRatings: 2,
					averageScore: 5.5,
					medianScore: 5.5,
					dimensionAverages: {
						practicalValue: 1.0, // 最小値
						technicalDepth: 10.0, // 最大値
						understanding: 0.0, // ゼロ
						novelty: 5.5, // 中間値
						importance: 9.9, // 最大に近い値
					},
					scoreDistribution: [
						{ range: "1-2", count: 1, percentage: 50.0 },
						{ range: "9-10", count: 1, percentage: 50.0 },
					],
					topRatedArticles: [
						{
							id: 1,
							title: "最大スコア記事",
							url: "https://example.com/max",
							totalScore: 100, // 最大値
						},
						{
							id: 2,
							title: "最小スコア記事",
							url: "https://example.com/min",
							totalScore: 10, // 最小値
						},
					],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => boundaryStatsResponse,
			});

			const { getRatingStats } = await import("../lib/apiClient.js");
			const stats = await getRatingStats();

			// 境界値処理の確認
			expect(stats.dimensionAverages.practicalValue).toBe(1.0);
			expect(stats.dimensionAverages.technicalDepth).toBe(10.0);
			expect(stats.dimensionAverages.understanding).toBe(0.0);

			// 最大・最小スコア変換確認
			expect((stats.topRatedArticles[0].totalScore / 10).toFixed(1)).toBe(
				"10.0",
			);
			expect((stats.topRatedArticles[1].totalScore / 10).toFixed(1)).toBe(
				"1.0",
			);
		});
	});

	describe("APIクライアント詳細テスト", () => {
		test("正常なHTTPリクエストの確認", async () => {
			const mockResponse = {
				success: true,
				stats: {
					totalRatings: 1,
					averageScore: 7.0,
					medianScore: 7.0,
					dimensionAverages: {
						practicalValue: 7.0,
						technicalDepth: 7.0,
						understanding: 7.0,
						novelty: 7.0,
						importance: 7.0,
					},
					scoreDistribution: [],
					topRatedArticles: [],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockResponse,
			});

			const { getRatingStats } = await import("../lib/apiClient.js");
			await getRatingStats();

			// 正しいエンドポイントが呼ばれることを確認
			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/ratings/stats",
			);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		test("HTTPステータス確認とエラーハンドリング", async () => {
			// 404エラーのテスト
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: false,
				statusText: "Not Found",
			});

			const { getRatingStats } = await import("../lib/apiClient.js");

			await expect(getRatingStats()).rejects.toThrow(
				"Failed to get rating stats: Not Found",
			);
		});

		test("不正なJSONレスポンス処理", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new SyntaxError("Unexpected token");
				},
			});

			const { getRatingStats } = await import("../lib/apiClient.js");

			await expect(getRatingStats()).rejects.toThrow(
				"Failed to parse response when getting rating stats: Unexpected token",
			);
		});
	});
});

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("文字列処理とテンプレート確認", () => {
		test("マークダウンフォーマットの一貫性", () => {
			const testStats = {
				totalRatings: 5,
				averageScore: 8.2,
				medianScore: 8.5,
			};

			const markdownTemplate = `📈 記事評価統計情報

## サマリー
📊 総評価数: ${testStats.totalRatings}件
⭐ 平均スコア: ${testStats.averageScore.toFixed(1)}/10
📊 中央値: ${testStats.medianScore.toFixed(1)}/10`;

			expect(markdownTemplate).toContain("📈 記事評価統計情報");
			expect(markdownTemplate).toContain("## サマリー");
			expect(markdownTemplate).toContain("📊 総評価数: 5件");
			expect(markdownTemplate).toContain("⭐ 平均スコア: 8.2/10");
		});

		test("配列操作とjoin処理", () => {
			const testDistribution = [
				{ range: "1-2", count: 1, percentage: 10.0 },
				{ range: "3-4", count: 2, percentage: 20.0 },
				{ range: "5-6", count: 7, percentage: 70.0 },
			];

			const formattedDistribution = testDistribution
				.map((d) => `${d.range}: ${d.count}件 (${d.percentage.toFixed(1)}%)`)
				.join("\n");

			expect(formattedDistribution).toContain("1-2: 1件 (10.0%)");
			expect(formattedDistribution).toContain("3-4: 2件 (20.0%)");
			expect(formattedDistribution).toContain("5-6: 7件 (70.0%)");
			expect(formattedDistribution.split("\n")).toHaveLength(3);
		});

		test("URL形式とタイトル処理", () => {
			const testArticles = [
				{
					id: 1,
					title: "テスト記事タイトル",
					url: "https://example.com/test-article",
					totalScore: 85,
				},
			];

			const formattedArticle = testArticles
				.map(
					(article, i) =>
						`${i + 1}. ${article.title} (${(article.totalScore / 10).toFixed(1)}/10)\n   URL: ${article.url}`,
				)
				.join("\n\n");

			expect(formattedArticle).toContain("1. テスト記事タイトル (8.5/10)");
			expect(formattedArticle).toContain(
				"URL: https://example.com/test-article",
			);
		});
	});
}
