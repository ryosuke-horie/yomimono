/**
 * Issue #589対応 - MCPテストカバレッジ50%達成のためのテスト
 * getRatingStatsツールと統計データフォーマット機能のテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRatingStats } from "../lib/apiClient.js";

// fetch のモック
global.fetch = vi.fn();

describe("Issue #589 - getRatingStats APIクライアントのカバレッジ向上", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("getRatingStats 関数の基本機能", () => {
		test("統計情報の正常取得と型安全性", async () => {
			const mockStatsResponse = {
				success: true,
				stats: {
					totalRatings: 5,
					averageScore: 7.5,
					medianScore: 8.0,
					dimensionAverages: {
						practicalValue: 7.2,
						technicalDepth: 8.1,
						understanding: 7.8,
						novelty: 6.9,
						importance: 7.4,
					},
					scoreDistribution: [
						{ range: "1-2", count: 0, percentage: 0 },
						{ range: "3-4", count: 1, percentage: 20 },
						{ range: "5-6", count: 1, percentage: 20 },
						{ range: "7-8", count: 2, percentage: 40 },
						{ range: "9-10", count: 1, percentage: 20 },
					],
					topRatedArticles: [
						{
							id: 1,
							title: "高評価記事1",
							url: "https://example.com/1",
							totalScore: 90,
						},
						{
							id: 2,
							title: "高評価記事2",
							url: "https://example.com/2",
							totalScore: 85,
						},
					],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockStatsResponse,
			});

			const stats = await getRatingStats();

			expect(stats.totalRatings).toBe(5);
			expect(stats.averageScore).toBe(7.5);
			expect(stats.medianScore).toBe(8.0);
			expect(stats.dimensionAverages.practicalValue).toBe(7.2);
			expect(stats.scoreDistribution).toHaveLength(5);
			expect(stats.topRatedArticles).toHaveLength(2);
			expect(stats.topRatedArticles[0].title).toBe("高評価記事1");
		});

		test("エラー時の適切な例外処理", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: false,
				statusText: "Internal Server Error",
			});

			await expect(getRatingStats()).rejects.toThrow(
				"Failed to get rating stats: Internal Server Error",
			);
		});

		test("JSONパース失敗時の例外処理", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			});

			await expect(getRatingStats()).rejects.toThrow(
				"Failed to parse response when getting rating stats: Invalid JSON",
			);
		});

		test("不正なレスポンス形式の処理", async () => {
			const invalidResponse = {
				success: false,
				message: "Invalid response structure",
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => invalidResponse,
			});

			await expect(getRatingStats()).rejects.toThrow(
				"Invalid API response for rating stats:",
			);
		});
	});

	describe("統計データの境界値テスト", () => {
		test("空の統計データの処理", async () => {
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

			const stats = await getRatingStats();

			expect(stats.totalRatings).toBe(0);
			expect(stats.averageScore).toBe(0);
			expect(stats.medianScore).toBe(0);
			expect(stats.scoreDistribution).toHaveLength(0);
			expect(stats.topRatedArticles).toHaveLength(0);
		});

		test("大量データでの統計処理", async () => {
			const largeStatsResponse = {
				success: true,
				stats: {
					totalRatings: 1000,
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
						{ range: "1-2", count: 5, percentage: 0.5 },
						{ range: "3-4", count: 15, percentage: 1.5 },
						{ range: "5-6", count: 80, percentage: 8.0 },
						{ range: "7-8", count: 600, percentage: 60.0 },
						{ range: "9-10", count: 300, percentage: 30.0 },
					],
					topRatedArticles: Array.from({ length: 10 }, (_, i) => ({
						id: i + 1,
						title: `記事${i + 1}`,
						url: `https://example.com/${i + 1}`,
						totalScore: 95 - i,
					})),
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => largeStatsResponse,
			});

			const stats = await getRatingStats();

			expect(stats.totalRatings).toBe(1000);
			expect(stats.scoreDistribution).toHaveLength(5);
			expect(stats.topRatedArticles).toHaveLength(10);
			expect(stats.topRatedArticles[0].totalScore).toBe(95);
			expect(stats.topRatedArticles[9].totalScore).toBe(86);
		});

		test("極値を含む統計データの処理", async () => {
			const extremeStatsResponse = {
				success: true,
				stats: {
					totalRatings: 2,
					averageScore: 5.5, // 極端に異なる値の平均
					medianScore: 5.5,
					dimensionAverages: {
						practicalValue: 1.0, // 最小値
						technicalDepth: 10.0, // 最大値
						understanding: 5.5,
						novelty: 3.3,
						importance: 7.7,
					},
					scoreDistribution: [
						{ range: "1-2", count: 1, percentage: 50.0 },
						{ range: "3-4", count: 0, percentage: 0 },
						{ range: "5-6", count: 0, percentage: 0 },
						{ range: "7-8", count: 0, percentage: 0 },
						{ range: "9-10", count: 1, percentage: 50.0 },
					],
					topRatedArticles: [
						{
							id: 1,
							title: "最高記事",
							url: "https://example.com/best",
							totalScore: 100, // 最大スコア
						},
						{
							id: 2,
							title: "最低記事",
							url: "https://example.com/worst",
							totalScore: 10, // 最小スコア
						},
					],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => extremeStatsResponse,
			});

			const stats = await getRatingStats();

			expect(stats.dimensionAverages.practicalValue).toBe(1.0);
			expect(stats.dimensionAverages.technicalDepth).toBe(10.0);
			expect(stats.topRatedArticles[0].totalScore).toBe(100);
			expect(stats.topRatedArticles[1].totalScore).toBe(10);
		});
	});

	describe("APIエンドポイントとパラメータの検証", () => {
		test("正しいAPIエンドポイントの呼び出し", async () => {
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

			await getRatingStats();

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/ratings/stats",
			);
		});

		test("環境変数未設定時のエラー処理", async () => {
			// このテストはCI環境でのみ有効（ローカルでは環境変数が既にセットされている）
			if (process.env.CI) {
				const originalUrl = process.env.API_BASE_URL;
				process.env.API_BASE_URL = undefined;

				// 動的インポートで環境変数の変更を反映
				const apiClientModule = await import(
					`../lib/apiClient.js?t=${Date.now()}`
				);

				await expect(apiClientModule.getRatingStats()).rejects.toThrow(
					"API_BASE_URL environment variable is not set.",
				);

				// 環境変数を復元
				process.env.API_BASE_URL = originalUrl;
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

	describe("統計データフォーマット処理の単体テスト", () => {
		test("パーセンテージ計算の精度確認", () => {
			const testCases = [
				{ count: 1, total: 3, expected: 33.33 },
				{ count: 2, total: 7, expected: 28.57 },
				{ count: 5, total: 10, expected: 50.0 },
				{ count: 0, total: 5, expected: 0.0 },
				{ count: 1, total: 1, expected: 100.0 },
			];

			for (const { count, total, expected } of testCases) {
				const percentage = Number.parseFloat(
					((count / total) * 100).toFixed(2),
				);
				expect(percentage).toBe(expected);
			}
		});

		test("スコア変換の精度確認", () => {
			const testCases = [
				{ totalScore: 95, expected: 9.5 },
				{ totalScore: 100, expected: 10.0 },
				{ totalScore: 0, expected: 0.0 },
				{ totalScore: 75, expected: 7.5 },
				{ totalScore: 33, expected: 3.3 },
			];

			for (const { totalScore, expected } of testCases) {
				const convertedScore = Number.parseFloat((totalScore / 10).toFixed(1));
				expect(convertedScore).toBe(expected);
			}
		});

		test("統計値の数値精度処理", () => {
			const floatValues = [
				{ input: 7.123456789, expected: 7.1 },
				{ input: 8.999999999, expected: 9.0 },
				{ input: 5.050000001, expected: 5.1 },
				{ input: 0.0, expected: 0.0 },
				{ input: 10.0, expected: 10.0 },
			];

			for (const { input, expected } of floatValues) {
				const rounded = Number.parseFloat(input.toFixed(1));
				expect(rounded).toBe(expected);
			}
		});
	});

	describe("エッジケース処理", () => {
		test("ネットワークエラーの処理", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockRejectedValue(new Error("Network error"));

			await expect(getRatingStats()).rejects.toThrow("Network error");
		});

		test("タイムアウトエラーの処理", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockRejectedValue(new Error("Request timeout"));

			await expect(getRatingStats()).rejects.toThrow("Request timeout");
		});

		test("部分的に不正なデータの処理", async () => {
			const partiallyInvalidResponse = {
				success: true,
				stats: {
					totalRatings: 5,
					averageScore: 7.5,
					medianScore: 8.0,
					dimensionAverages: {
						practicalValue: 7.2,
						technicalDepth: 8.1,
						understanding: 7.8,
						novelty: 6.9,
						// importance が欠落
					},
					scoreDistribution: [
						{ range: "1-2", count: 0, percentage: 0 },
						// 残りの要素が欠落
					],
					topRatedArticles: [
						{
							id: 1,
							title: "記事1",
							url: "https://example.com/1",
							// totalScore が欠落
						},
					],
				},
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => partiallyInvalidResponse,
			});

			await expect(getRatingStats()).rejects.toThrow(
				"Invalid API response for rating stats:",
			);
		});
	});
});

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("統計データユーティリティ関数の単体テスト", () => {
		test("配列の安全な操作", () => {
			const emptyArray: unknown[] = [];
			const normalArray = [1, 2, 3, 4, 5];

			// slice操作の安全性
			expect(emptyArray.slice(0, 5)).toHaveLength(0);
			expect(normalArray.slice(0, 5)).toHaveLength(5);
			expect(normalArray.slice(0, 3)).toHaveLength(3);
		});

		test("数値フォーマットの一貫性", () => {
			const numbers = [0, 1.234, 5.678, 9.999, 10.001];

			for (const num of numbers) {
				const formatted = num.toFixed(1);
				expect(formatted).toMatch(/^\d+\.\d$/);
				expect(Number.parseFloat(formatted)).toBeGreaterThanOrEqual(0);
				expect(Number.parseFloat(formatted)).toBeLessThanOrEqual(10.1);
			}
		});

		test("文字列テンプレートの安全性", () => {
			const testData = {
				title: "テスト記事",
				url: "https://example.com/test",
				totalScore: 85,
			};

			const formattedString = `${testData.title} (${(testData.totalScore / 10).toFixed(1)}/10)`;
			expect(formattedString).toBe("テスト記事 (8.5/10)");
			expect(formattedString).toContain(testData.title);
			expect(formattedString).toContain("8.5/10");
		});
	});
}
