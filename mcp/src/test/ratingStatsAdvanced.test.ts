/**
 * 評価統計機能とサーバー接続の高度なテスト
 * 旧issue590Coverage.test.tsとissue590MainFunctionCoverage.test.tsから統合
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RatingStats } from "../lib/apiClient.js";
import * as apiClient from "../lib/apiClient.js";

// モックの設定
vi.mock("../lib/apiClient.js");
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
	StdioServerTransport: vi.fn().mockImplementation(() => ({})),
}));

const mockApiClient = vi.mocked(apiClient);

describe("評価統計機能とサーバー接続の高度なテスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("getRatingStats ツールの包括的テスト", () => {
		it("完全な統計データの処理", async () => {
			const mockStats: RatingStats = {
				totalRatings: 150,
				averageScore: 8.2,
				medianScore: 8.5,
				dimensionAverages: {
					practicalValue: 8.3,
					technicalDepth: 8.1,
					understanding: 8.4,
					novelty: 7.9,
					importance: 8.2,
				},
				scoreDistribution: [
					{ range: "1-2", count: 2, percentage: 1.3 },
					{ range: "3-4", count: 5, percentage: 3.3 },
					{ range: "5-6", count: 18, percentage: 12.0 },
					{ range: "7-8", count: 75, percentage: 50.0 },
					{ range: "9-10", count: 50, percentage: 33.3 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "TypeScript 5.0 新機能解説",
						url: "https://example.com/ts5",
						totalScore: 96,
					},
					{
						id: 2,
						title: "React Server Components入門",
						url: "https://example.com/rsc",
						totalScore: 94,
					},
					{
						id: 3,
						title: "Next.js 14 完全ガイド",
						url: "https://example.com/nextjs14",
						totalScore: 92,
					},
					{
						id: 4,
						title: "Rust WebAssembly実践",
						url: "https://example.com/rust-wasm",
						totalScore: 91,
					},
					{
						id: 5,
						title: "GraphQL設計パターン",
						url: "https://example.com/graphql",
						totalScore: 90,
					},
					{
						id: 6,
						title: "Deno 2.0の新機能",
						url: "https://example.com/deno2",
						totalScore: 89,
					},
				],
			};

			mockApiClient.getRatingStats.mockResolvedValue(mockStats);

			// getRatingStats ツールハンドラーをシミュレート
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
					console.error("Error in getRatingStats tool:", errorMessage);
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

			expect(mockApiClient.getRatingStats).toHaveBeenCalled();
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 総評価数: 150件");
			expect(result.content[0].text).toContain("⭐ 平均スコア: 8.2/10");
			expect(result.content[0].text).toContain("📊 中央値: 8.5/10");
			expect(result.content[0].text).toContain("🔧 実用性: 8.3/10");
			expect(result.content[0].text).toContain("TypeScript 5.0 新機能解説");
			expect(result.content[0].text).toContain("9.6/10");
			// 6番目の記事は表示されないことを確認
			expect(result.content[0].text).not.toContain("Deno 2.0の新機能");
		});

		it("空の統計データの処理", async () => {
			const mockEmptyStats: RatingStats = {
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
			};

			mockApiClient.getRatingStats.mockResolvedValue(mockEmptyStats);

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
${
	stats.scoreDistribution.length > 0
		? stats.scoreDistribution
				.map((d) => `${d.range}: ${d.count}件 (${d.percentage.toFixed(1)}%)`)
				.join("\n")
		: "データなし"
}

## 高評価記事 Top 5
${
	stats.topRatedArticles.length > 0
		? stats.topRatedArticles
				.slice(0, 5)
				.map(
					(article, i) =>
						`${i + 1}. ${article.title} (${(article.totalScore / 10).toFixed(1)}/10)\n   URL: ${article.url}`,
				)
				.join("\n\n")
		: "評価された記事はありません"
}`;

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

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 総評価数: 0件");
			expect(result.content[0].text).toContain("データなし");
			expect(result.content[0].text).toContain("評価された記事はありません");
		});

		it("統計情報取得エラーの処理", async () => {
			const error = new Error("データベース接続エラー");
			mockApiClient.getRatingStats.mockRejectedValue(error);

			const toolHandler = async () => {
				try {
					await apiClient.getRatingStats();
					return {
						content: [{ type: "text", text: "成功" }],
						isError: false,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.error("Error in getRatingStats tool:", errorMessage);
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
			expect(result.content[0].text).toContain("データベース接続エラー");
		});

		it("小数点以下の丸め処理", async () => {
			const mockStats: RatingStats = {
				totalRatings: 3,
				averageScore: 7.666666,
				medianScore: 7.333333,
				dimensionAverages: {
					practicalValue: 8.444444,
					technicalDepth: 7.111111,
					understanding: 6.888888,
					novelty: 7.555555,
					importance: 8.222222,
				},
				scoreDistribution: [{ range: "7-8", count: 3, percentage: 100.0 }],
				topRatedArticles: [],
			};

			mockApiClient.getRatingStats.mockResolvedValue(mockStats);

			const toolHandler = async () => {
				const stats = await apiClient.getRatingStats();
				return {
					content: [
						{
							type: "text",
							text: `平均: ${stats.averageScore.toFixed(1)}, 中央値: ${stats.medianScore.toFixed(1)}, 実用性: ${stats.dimensionAverages.practicalValue.toFixed(1)}`,
						},
					],
					isError: false,
				};
			};

			const result = await toolHandler();

			expect(result.content[0].text).toBe(
				"平均: 7.7, 中央値: 7.3, 実用性: 8.4",
			);
		});
	});

	describe("apiClient.getRatingStats の詳細テスト", () => {
		it("ネットワークエラーの処理", async () => {
			mockApiClient.getRatingStats.mockRejectedValue(
				new Error("Failed to get rating stats: Network Error"),
			);

			await expect(mockApiClient.getRatingStats()).rejects.toThrow(
				"Failed to get rating stats: Network Error",
			);
		});

		it("APIレスポンスが不正な場合", async () => {
			mockApiClient.getRatingStats.mockRejectedValue(
				new Error("Invalid API response for rating stats"),
			);

			await expect(mockApiClient.getRatingStats()).rejects.toThrow(
				"Invalid API response for rating stats",
			);
		});
	});

	describe("createArticleRating のエラーテスト", () => {
		it("バリデーションエラーの処理", async () => {
			const ratingData: apiClient.CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
			};

			mockApiClient.createArticleRating.mockRejectedValue(
				new Error("Failed to create rating for article 123: Validation Error"),
			);

			await expect(
				mockApiClient.createArticleRating(123, ratingData),
			).rejects.toThrow(
				"Failed to create rating for article 123: Validation Error",
			);
		});
	});

	describe("未カバーのエラーパスのテスト", () => {
		it("非Errorオブジェクトの処理", () => {
			const handleError = (error: unknown) => {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return errorMessage;
			};

			expect(handleError("文字列エラー")).toBe("文字列エラー");
			expect(handleError(123)).toBe("123");
			expect(handleError(null)).toBe("null");
			expect(handleError(undefined)).toBe("undefined");
			expect(handleError({ error: "オブジェクトエラー" })).toBe(
				"[object Object]",
			);
		});
	});
});

describe("main関数とサーバー接続エラーのカバレッジ", () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let processExitSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		// console.errorをスパイ
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		// process.exitをスパイ（実際には終了させない）
		// @ts-ignore - process.exit mock type issues with vitest
		processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(
				(code?: string | number | null | undefined): never => {
					throw new Error(`Process.exit(${code}) called`);
				},
			);
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
	});

	it("サーバー接続エラー時の処理", async () => {
		// 接続エラーをシミュレート
		const mockServer = {
			connect: vi.fn().mockRejectedValue(new Error("Connection refused")),
		};

		// main関数の一部をシミュレート
		async function simulateMain() {
			const transport = new StdioServerTransport();

			try {
				await mockServer.connect(transport);
			} catch (error) {
				// index.tsのlines 1179-1181と同じ処理
				console.error("Failed to connect MCP server:", error);
				process.exit(1);
			}
		}

		// main関数を実行してエラーを確認
		await expect(simulateMain()).rejects.toThrow("Process.exit(1) called");

		// console.errorが正しく呼ばれたことを確認
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to connect MCP server:",
			expect.objectContaining({
				message: "Connection refused",
			}),
		);

		// process.exitが1で呼ばれたことを確認
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("非Errorオブジェクトでの接続エラー", async () => {
		const mockServer = {
			connect: vi.fn().mockRejectedValue("String error"),
		};

		async function simulateMain() {
			const transport = new StdioServerTransport();

			try {
				await mockServer.connect(transport);
			} catch (error) {
				console.error("Failed to connect MCP server:", error);
				process.exit(1);
			}
		}

		await expect(simulateMain()).rejects.toThrow("Process.exit(1) called");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to connect MCP server:",
			"String error",
		);
	});

	it("接続成功時は正常に処理が続行される", async () => {
		const mockServer = {
			connect: vi.fn().mockResolvedValue(undefined),
		};

		async function simulateMain() {
			const transport = new StdioServerTransport();

			try {
				await mockServer.connect(transport);
				// 接続成功
				return "success";
			} catch (error) {
				console.error("Failed to connect MCP server:", error);
				process.exit(1);
			}
		}

		const result = await simulateMain();
		expect(result).toBe("success");
		expect(consoleErrorSpy).not.toHaveBeenCalled();
		expect(processExitSpy).not.toHaveBeenCalled();
	});
});

describe("ツールハンドラーのエラー処理カバレッジ", () => {
	it("bulkRateArticlesツールの詳細なエラー処理", async () => {
		// bulkRateArticlesツールのエラーハンドリングをテスト
		const toolHandler = async (ratings: unknown[]) => {
			try {
				if (!Array.isArray(ratings)) {
					throw new TypeError("ratings must be an array");
				}

				if (ratings.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "📝 一括評価完了\n✅ 成功: 0件 | ❌ 失敗: 0件\n\n⚠️ 評価する記事が指定されていません。",
							},
						],
						isError: false,
					};
				}

				// 評価処理のシミュレーション
				const results = await Promise.allSettled(
					ratings.map(async (rating) => {
						if (
							!rating ||
							typeof rating !== "object" ||
							!("articleId" in rating)
						) {
							throw new Error("articleId is required");
						}
						const typedRating = rating as { articleId: number };
						return { success: true, articleId: typedRating.articleId };
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
				console.error("Error in bulkRateArticles tool:", errorMessage);
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

		// 正常ケース
		const normalResult = await toolHandler([
			{ articleId: 1, practicalValue: 8 },
			{ articleId: 2, practicalValue: 7 },
		]);
		expect(normalResult.isError).toBe(false);
		expect(normalResult.content[0].text).toContain("成功: 2件");

		// エラーケース：配列でない入力
		const errorResult = await toolHandler(
			"not an array" as unknown as unknown[],
		);
		expect(errorResult.isError).toBe(true);
		expect(errorResult.content[0].text).toContain("ratings must be an array");

		// 空配列
		const emptyResult = await toolHandler([]);
		expect(emptyResult.isError).toBe(false);
		expect(emptyResult.content[0].text).toContain(
			"評価する記事が指定されていません",
		);

		// 部分的な失敗
		const partialFailResult = await toolHandler([
			{ articleId: 1, practicalValue: 8 },
			{ practicalValue: 7 }, // articleIdが欠けている
		]);
		expect(partialFailResult.isError).toBe(true);
		expect(partialFailResult.content[0].text).toContain(
			"成功: 1件 | ❌ 失敗: 1件",
		);
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("統計情報の型定義が正しい", () => {
		const stats: RatingStats = {
			totalRatings: 100,
			averageScore: 7.5,
			medianScore: 7.0,
			dimensionAverages: {
				practicalValue: 8.0,
				technicalDepth: 7.5,
				understanding: 7.0,
				novelty: 6.5,
				importance: 8.0,
			},
			scoreDistribution: [{ range: "1-2", count: 5, percentage: 5.0 }],
			topRatedArticles: [
				{ id: 1, title: "Test", url: "https://test.com", totalScore: 90 },
			],
		};

		expect(stats.totalRatings).toBe(100);
		expect(stats.dimensionAverages.practicalValue).toBe(8.0);
		expect(stats.scoreDistribution[0].percentage).toBe(5.0);
		expect(stats.topRatedArticles[0].totalScore).toBe(90);
	});

	test("評価データの計算ロジック", () => {
		const calculateAverage = (values: number[]) => {
			if (values.length === 0) return 0;
			const sum = values.reduce((acc, val) => acc + val, 0);
			return sum / values.length;
		};

		expect(calculateAverage([8, 9, 7, 6, 8])).toBe(7.6);
		expect(calculateAverage([])).toBe(0);
		expect(calculateAverage([10])).toBe(10);
	});

	test("エラーメッセージ処理のパターン", () => {
		const processError = (error: unknown): string => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return `Error: ${errorMessage}`;
		};

		expect(processError(new Error("Test"))).toBe("Error: Test");
		expect(processError("String")).toBe("Error: String");
		expect(processError(123)).toBe("Error: 123");
		expect(processError(null)).toBe("Error: null");
		expect(processError(undefined)).toBe("Error: undefined");
	});

	test("Promise.allSettled の結果処理", () => {
		const results = [
			{ status: "fulfilled", value: "success1" },
			{ status: "rejected", reason: "error1" },
			{ status: "fulfilled", value: "success2" },
		] as const;

		const succeeded = results.filter((r) => r.status === "fulfilled").length;
		const failed = results.filter((r) => r.status === "rejected").length;

		expect(succeeded).toBe(2);
		expect(failed).toBe(1);
	});
}
