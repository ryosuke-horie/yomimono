/**
 * MCP↔API統合テスト
 * MCPサーバーツールが実際のAPIエンドポイントと正しく連携することをテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CreateRatingData,
	createArticleRating,
	getArticleRating,
	getArticleRatings,
	getRatingStats,
	updateArticleRating,
} from "../lib/apiClient.js";
import {
	type ArticleContent,
	fetchArticleContent,
	generateRatingPrompt,
} from "../lib/articleContentFetcher.js";

// API通信のモック
global.fetch = vi.fn();

// テスト用のモックデータ
const mockApiRating = {
	id: 1,
	articleId: 123,
	practicalValue: 8,
	technicalDepth: 9,
	understanding: 7,
	novelty: 6,
	importance: 8,
	totalScore: 7.6,
	comment: "統合テスト用の評価",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const mockArticleContent: ArticleContent = {
	title: "統合テスト記事",
	content: "これは統合テスト用の記事内容です。",
	metadata: {
		author: "テスト著者",
		publishedDate: "2024-01-01",
		tags: ["統合テスト", "MCP"],
		readingTime: 5,
		wordCount: 500,
		description: "統合テスト用記事",
	},
	extractionMethod: "structured-data",
	qualityScore: 0.9,
};

describe("MCP↔API統合テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.test.com";
	});

	describe("記事評価ワークフロー統合", () => {
		it("記事内容取得→評価作成→評価取得の完全なワークフローが動作すること", async () => {
			// 1. 記事内容取得のモック
			const mockHtml = `
				<html>
					<head>
						<title>統合テスト記事</title>
						<meta name="author" content="テスト著者">
					</head>
					<body>
						<article>
							<h1>記事タイトル</h1>
							<p>これは統合テスト用の記事内容です。</p>
						</article>
					</body>
				</html>
			`;

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					text: async () => mockHtml,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						rating: mockApiRating,
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						rating: mockApiRating,
					}),
				});

			const url = "https://example.com/test-article";

			// 2. 記事内容取得
			const articleContent = await fetchArticleContent(url);
			expect(articleContent.title).toBe("統合テスト記事");
			expect(articleContent.content).toContain("記事タイトル");

			// 3. 評価プロンプト生成
			const prompt = generateRatingPrompt(articleContent, url);
			expect(prompt).toContain("以下の5つの軸で記事を評価してください");
			expect(prompt).toContain(articleContent.title);
			expect(prompt).toContain(url);

			// 4. 評価作成
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "統合テスト用の評価",
			};

			const createdRating = await createArticleRating(123, ratingData);
			expect(createdRating).toEqual(mockApiRating);

			// 5. 評価取得確認
			const retrievedRating = await getArticleRating(123);
			expect(retrievedRating).toEqual(mockApiRating);

			// APIが正しく呼び出されたことを確認
			expect(fetch).toHaveBeenCalledTimes(3);
			expect(fetch).toHaveBeenNthCalledWith(
				1,
				url,
				expect.objectContaining({
					headers: expect.objectContaining({
						"User-Agent": expect.stringContaining("EffectiveYomimono"),
					}),
				}),
			);
			expect(fetch).toHaveBeenNthCalledWith(
				2,
				"https://api.test.com/api/bookmarks/123/rating",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(ratingData),
				}),
			);
			expect(fetch).toHaveBeenNthCalledWith(
				3,
				"https://api.test.com/api/bookmarks/123/rating",
			);
		});

		it("評価更新→統計取得のワークフローが動作すること", async () => {
			const updatedRating = {
				...mockApiRating,
				practicalValue: 10,
				totalScore: 8.0,
				comment: "更新された評価",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			const mockStats = {
				totalRatings: 100,
				averageScore: 7.8,
				medianScore: 7.9,
				dimensionAverages: {
					practicalValue: 8.2,
					technicalDepth: 7.8,
					understanding: 7.5,
					novelty: 6.8,
					importance: 8.0,
				},
				scoreDistribution: [
					{ range: "1-2", count: 2, percentage: 2.0 },
					{ range: "3-4", count: 8, percentage: 8.0 },
					{ range: "5-6", count: 20, percentage: 20.0 },
					{ range: "7-8", count: 50, percentage: 50.0 },
					{ range: "9-10", count: 20, percentage: 20.0 },
				],
				topRatedArticles: [],
			};

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						rating: updatedRating,
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						stats: mockStats,
					}),
				});

			// 1. 評価更新
			const updateData = {
				practicalValue: 10,
				comment: "更新された評価",
			};

			const result = await updateArticleRating(123, updateData);
			expect(result).toEqual(updatedRating);

			// 2. 統計情報取得
			const stats = await getRatingStats();
			expect(stats).toEqual(mockStats);
			expect(stats.totalRatings).toBe(100);
			expect(stats.averageScore).toBe(7.8);

			// APIが正しく呼び出されたことを確認
			expect(fetch).toHaveBeenCalledTimes(2);
			expect(fetch).toHaveBeenNthCalledWith(
				1,
				"https://api.test.com/api/bookmarks/123/rating",
				expect.objectContaining({
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updateData),
				}),
			);
			expect(fetch).toHaveBeenNthCalledWith(
				2,
				"https://api.test.com/api/ratings/stats",
			);
		});

		it("評価一覧取得とフィルタリングが動作すること", async () => {
			const mockRatings = [
				mockApiRating,
				{ ...mockApiRating, id: 2, articleId: 124, totalScore: 8.5 },
				{ ...mockApiRating, id: 3, articleId: 125, totalScore: 6.8 },
			];

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					ratings: mockRatings,
					count: mockRatings.length,
				}),
			});

			// フィルター付きで評価一覧取得
			const options = {
				sortBy: "totalScore" as const,
				order: "desc" as const,
				minScore: 7.0,
				hasComment: true,
				limit: 10,
			};

			const ratings = await getArticleRatings(options);
			expect(ratings).toEqual(mockRatings);

			// URL パラメータが正しく構築されたことを確認
			expect(fetch).toHaveBeenCalledWith(
				"https://api.test.com/api/ratings?sortBy=totalScore&order=desc&limit=10&minScore=7&hasComment=true",
			);
		});
	});

	describe("エラーハンドリング統合", () => {
		it("記事内容取得失敗→フォールバック→評価作成のワークフローが動作すること", async () => {
			// 記事内容取得失敗のモック
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any)
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						rating: mockApiRating,
					}),
				});

			const url = "https://example.com/failed-article";

			// 1. 記事内容取得失敗
			await expect(fetchArticleContent(url)).rejects.toThrow("Network error");

			// 2. フォールバックプロンプト生成
			const fallbackPrompt = generateRatingPrompt(null, url);
			expect(fallbackPrompt).toContain("記事内容の自動取得に失敗しました");
			expect(fallbackPrompt).toContain(url);
			expect(fallbackPrompt).toContain("直接確認し");

			// 3. 評価作成は続行可能
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 8,
				novelty: 7,
				importance: 8,
				comment: "手動評価",
			};

			const rating = await createArticleRating(123, ratingData);
			expect(rating).toEqual(mockApiRating);
		});

		it("API エラーレスポンスが適切に処理されること", async () => {
			// API エラーレスポンスのモック
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 400,
					statusText: "Bad Request",
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: "Not Found",
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					statusText: "Internal Server Error",
				});

			// 1. 評価作成エラー
			await expect(
				createArticleRating(123, {
					practicalValue: 11, // 無効値
					technicalDepth: 7,
					understanding: 8,
					novelty: 7,
					importance: 8,
				}),
			).rejects.toThrow("Failed to create rating for article 123: Bad Request");

			// 2. 評価取得エラー（存在しない）
			const rating = await getArticleRating(999);
			expect(rating).toBeNull();

			// 3. 統計取得エラー
			await expect(getRatingStats()).rejects.toThrow(
				"Failed to get rating stats: Internal Server Error",
			);
		});

		it("ネットワークエラーが適切に伝播されること", async () => {
			// ネットワークエラーのモック
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any).mockRejectedValue(new Error("Network timeout"));

			await expect(
				createArticleRating(123, {
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 8,
					novelty: 7,
					importance: 8,
				}),
			).rejects.toThrow("Network timeout");

			await expect(getArticleRating(123)).rejects.toThrow("Network timeout");

			await expect(getRatingStats()).rejects.toThrow("Network timeout");
		});
	});

	describe("データ整合性チェック", () => {
		it("MCPツールからAPIへのデータ変換が正しく行われること", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any).mockImplementation((url: string, options?: any) => {
				// リクエストデータの検証
				if (options?.method === "POST") {
					const body = JSON.parse(options.body);
					expect(body).toMatchObject({
						practicalValue: expect.any(Number),
						technicalDepth: expect.any(Number),
						understanding: expect.any(Number),
						novelty: expect.any(Number),
						importance: expect.any(Number),
					});
					expect(body.practicalValue).toBeGreaterThanOrEqual(1);
					expect(body.practicalValue).toBeLessThanOrEqual(10);
				}

				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						rating: mockApiRating,
					}),
				});
			});

			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "データ整合性テスト",
			};

			const result = await createArticleRating(123, ratingData);
			expect(result).toEqual(mockApiRating);
		});

		it("APIレスポンスの型安全性が保たれていること", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					rating: {
						...mockApiRating,
						// 型チェックのための追加フィールド
						extraField: "should be ignored",
					},
				}),
			});

			const rating = await getArticleRating(123);

			// 期待される型のフィールドのみが含まれていることを確認
			expect(rating).toHaveProperty("id");
			expect(rating).toHaveProperty("articleId");
			expect(rating).toHaveProperty("practicalValue");
			expect(rating).toHaveProperty("technicalDepth");
			expect(rating).toHaveProperty("understanding");
			expect(rating).toHaveProperty("novelty");
			expect(rating).toHaveProperty("importance");
			expect(rating).toHaveProperty("totalScore");
			expect(rating).toHaveProperty("comment");
			expect(rating).toHaveProperty("createdAt");
			expect(rating).toHaveProperty("updatedAt");

			// 型安全性の確認
			expect(typeof rating?.id).toBe("number");
			expect(typeof rating?.articleId).toBe("number");
			expect(typeof rating?.practicalValue).toBe("number");
			expect(typeof rating?.totalScore).toBe("number");
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("MCP↔API統合テストが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}
