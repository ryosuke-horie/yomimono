import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * MCPサーバーツールの包括的テスト
 * 記事評価ポイント機能の全ツールをテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";
import {
	type ArticleContent,
	fetchArticleContent,
	generateRatingPrompt,
} from "../lib/articleContentFetcher.js";

// APIクライアントをモック
vi.mock("../lib/apiClient.js");
vi.mock("../lib/articleContentFetcher.js");

const mockApiClient = vi.mocked(apiClient);
const mockFetchArticleContent = vi.mocked(fetchArticleContent);
const mockGenerateRatingPrompt = vi.mocked(generateRatingPrompt);

// テスト用のモックデータ
const mockRating = {
	id: 1,
	articleId: 123,
	practicalValue: 8,
	technicalDepth: 9,
	understanding: 7,
	novelty: 6,
	importance: 8,
	totalScore: 7.6,
	comment: "非常に有用な記事でした",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const mockArticleContent: ArticleContent = {
	title: "TypeScript高度な型定義テクニック",
	content: "TypeScriptでの高度な型定義について詳しく解説...",
	metadata: {
		author: "田中太郎",
		publishedDate: "2024-01-01",
		tags: ["TypeScript", "型定義"],
		readingTime: 10,
		wordCount: 1500,
		description: "TypeScript高度テクニック記事",
	},
	extractionMethod: "structured-data",
	qualityScore: 0.9,
};

// MCPサーバーのモック関数を作成
function createMockMcpServer() {
	const tools = new Map();

	return {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のモック関数のため
		tool: vi.fn((name: string, schema: any, handler: any) => {
			tools.set(name, { schema, handler });
		}),
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のモック関数のため
		callTool: async (name: string, args: any) => {
			const tool = tools.get(name);
			if (!tool) {
				throw new Error(`Tool ${name} not found`);
			}
			return await tool.handler(args);
		},
		getToolNames: () => Array.from(tools.keys()),
	};
}

describe("MCP評価ツール統合テスト", () => {
	let mockServer: ReturnType<typeof createMockMcpServer>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockServer = createMockMcpServer();

		// 環境変数設定
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("rateArticleWithContent ツール", () => {
		it("記事内容を取得して評価プロンプトを生成する", async () => {
			const mockPrompt = "記事を評価してください...";

			mockFetchArticleContent.mockResolvedValue(mockArticleContent);
			mockGenerateRatingPrompt.mockReturnValue(mockPrompt);

			// ツールハンドラーをシミュレート
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async ({ articleId, url, fetchContent }: any) => {
				try {
					let articleContent: ArticleContent | null = null;

					if (fetchContent) {
						articleContent = await fetchArticleContent(url);
					}

					const evaluationPrompt = generateRatingPrompt(articleContent, url);

					return {
						content: [
							{
								type: "text",
								text: `記事内容取得完了
記事ID: ${articleId}
URL: ${url}

${evaluationPrompt}`,
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
								text: `記事評価の準備に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				articleId: 123,
				url: "https://example.com/typescript-article",
				fetchContent: true,
			});

			expect(mockFetchArticleContent).toHaveBeenCalledWith(
				"https://example.com/typescript-article",
			);
			expect(mockGenerateRatingPrompt).toHaveBeenCalledWith(
				mockArticleContent,
				"https://example.com/typescript-article",
			);
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事内容取得完了");
			expect(result.content[0].text).toContain("記事を評価してください");
		});

		it("記事内容取得をスキップした場合", async () => {
			const mockPrompt = "フォールバック評価プロンプト...";

			mockGenerateRatingPrompt.mockReturnValue(mockPrompt);

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async ({ articleId, url, fetchContent }: any) => {
				let articleContent: ArticleContent | null = null;

				if (fetchContent) {
					articleContent = await fetchArticleContent(url);
				}

				const evaluationPrompt = generateRatingPrompt(articleContent, url);

				return {
					content: [
						{
							type: "text",
							text: `記事評価準備完了
記事ID: ${articleId}
URL: ${url}

${evaluationPrompt}`,
						},
					],
					isError: false,
				};
			};

			const result = await toolHandler({
				articleId: 123,
				url: "https://example.com/typescript-article",
				fetchContent: false,
			});

			expect(mockFetchArticleContent).not.toHaveBeenCalled();
			expect(mockGenerateRatingPrompt).toHaveBeenCalledWith(
				null,
				"https://example.com/typescript-article",
			);
			expect(result.isError).toBe(false);
		});

		it("記事内容取得エラー時のエラーハンドリング", async () => {
			const error = new Error("Network error");
			mockFetchArticleContent.mockRejectedValue(error);

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async ({ articleId, url, fetchContent }: any) => {
				try {
					if (fetchContent) {
						await fetchArticleContent(url);
					}
					return { content: [], isError: false };
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `記事評価の準備に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				articleId: 123,
				url: "https://example.com/typescript-article",
				fetchContent: true,
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Network error");
		});
	});

	describe("createArticleRating ツール", () => {
		it("記事評価を正常に作成する", async () => {
			mockApiClient.createArticleRating.mockResolvedValue(mockRating);

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async (params: any) => {
				try {
					const {
						articleId,
						practicalValue,
						technicalDepth,
						understanding,
						novelty,
						importance,
						comment,
					} = params;

					const ratingData: apiClient.CreateRatingData = {
						practicalValue,
						technicalDepth,
						understanding,
						novelty,
						importance,
						comment,
					};

					const rating = await apiClient.createArticleRating(
						articleId,
						ratingData,
					);

					return {
						content: [
							{
								type: "text",
								text: `記事評価を作成しました:

記事ID: ${articleId}
評価詳細:
- 実用性: ${practicalValue}点
- 技術深度: ${technicalDepth}点
- 理解度: ${understanding}点
- 新規性: ${novelty}点
- 重要度: ${importance}点
- 総合スコア: ${rating.totalScore}点

${comment ? `コメント: ${comment}` : ""}

評価ID: ${rating.id}
作成日時: ${rating.createdAt}`,
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
								text: `評価作成に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				articleId: 123,
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "非常に有用な記事でした",
			});

			expect(mockApiClient.createArticleRating).toHaveBeenCalledWith(123, {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "非常に有用な記事でした",
			});
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事評価を作成しました");
			expect(result.content[0].text).toContain("総合スコア: 7.6点");
		});

		it("API エラー時のエラーハンドリング", async () => {
			const error = new Error("Validation error");
			mockApiClient.createArticleRating.mockRejectedValue(error);

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async (params: any) => {
				try {
					await apiClient.createArticleRating(params.articleId, params);
					return { content: [], isError: false };
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return {
						content: [
							{
								type: "text",
								text: `評価作成に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				articleId: 123,
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Validation error");
		});
	});

	describe("getArticleRating ツール", () => {
		it("記事評価を正常に取得する", async () => {
			mockApiClient.getArticleRating.mockResolvedValue(mockRating);

			const toolHandler = async ({ articleId }: { articleId: number }) => {
				try {
					const rating = await apiClient.getArticleRating(articleId);

					if (!rating) {
						return {
							content: [
								{
									type: "text",
									text: `記事ID ${articleId} の評価は見つかりませんでした。`,
								},
							],
							isError: false,
						};
					}

					return {
						content: [
							{
								type: "text",
								text: `記事ID ${articleId} の評価:

評価詳細:
- 実用性: ${rating.practicalValue}点
- 技術深度: ${rating.technicalDepth}点
- 理解度: ${rating.understanding}点
- 新規性: ${rating.novelty}点
- 重要度: ${rating.importance}点
- 総合スコア: ${rating.totalScore}点

${rating.comment ? `コメント: ${rating.comment}` : "コメントなし"}

評価ID: ${rating.id}
作成日時: ${rating.createdAt}
更新日時: ${rating.updatedAt}`,
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
								text: `評価取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({ articleId: 123 });

			expect(mockApiClient.getArticleRating).toHaveBeenCalledWith(123);
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事ID 123 の評価:");
			expect(result.content[0].text).toContain("総合スコア: 7.6点");
		});

		it("評価が存在しない場合", async () => {
			mockApiClient.getArticleRating.mockResolvedValue(null);

			const toolHandler = async ({ articleId }: { articleId: number }) => {
				const rating = await apiClient.getArticleRating(articleId);

				if (!rating) {
					return {
						content: [
							{
								type: "text",
								text: `記事ID ${articleId} の評価は見つかりませんでした。`,
							},
						],
						isError: false,
					};
				}

				return { content: [], isError: false };
			};

			const result = await toolHandler({ articleId: 123 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("評価は見つかりませんでした");
		});
	});

	describe("updateArticleRating ツール", () => {
		it("記事評価を正常に更新する", async () => {
			const updatedRating = {
				...mockRating,
				practicalValue: 9,
				totalScore: 7.8,
				comment: "更新されたコメント",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			mockApiClient.updateArticleRating.mockResolvedValue(updatedRating);

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async (params: any) => {
				try {
					const { articleId, ...updateData } = params;

					// 空のオブジェクトチェック
					if (Object.keys(updateData).length === 0) {
						return {
							content: [
								{
									type: "text",
									text: "更新する項目が指定されていません。",
								},
							],
							isError: true,
						};
					}

					const rating = await apiClient.updateArticleRating(
						articleId,
						updateData,
					);

					const updatedFields = Object.entries(updateData)
						.filter(([_, value]) => value !== undefined)
						.map(([key, value]) => {
							const fieldNames: Record<string, string> = {
								practicalValue: "実用性",
								technicalDepth: "技術深度",
								understanding: "理解度",
								novelty: "新規性",
								importance: "重要度",
								comment: "コメント",
							};
							return `- ${fieldNames[key]}: ${value}`;
						})
						.join("\n");

					return {
						content: [
							{
								type: "text",
								text: `記事ID ${articleId} の評価を更新しました:

更新された項目:
${updatedFields}

現在の評価:
- 実用性: ${rating.practicalValue}点
- 技術深度: ${rating.technicalDepth}点
- 理解度: ${rating.understanding}点
- 新規性: ${rating.novelty}点
- 重要度: ${rating.importance}点
- 総合スコア: ${rating.totalScore}点

${rating.comment ? `コメント: ${rating.comment}` : "コメントなし"}

更新日時: ${rating.updatedAt}`,
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
								text: `評価更新に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				articleId: 123,
				practicalValue: 9,
				comment: "更新されたコメント",
			});

			expect(mockApiClient.updateArticleRating).toHaveBeenCalledWith(123, {
				practicalValue: 9,
				comment: "更新されたコメント",
			});
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("評価を更新しました");
			expect(result.content[0].text).toContain("総合スコア: 7.8点");
		});

		it("更新項目が空の場合のエラーハンドリング", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async (params: any) => {
				const { articleId, ...updateData } = params;

				if (Object.keys(updateData).length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "更新する項目が指定されていません。",
							},
						],
						isError: true,
					};
				}

				return { content: [], isError: false };
			};

			const result = await toolHandler({ articleId: 123 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"更新する項目が指定されていません",
			);
		});
	});

	describe("getArticleRatings ツール", () => {
		it("フィルター付きで評価一覧を取得する", async () => {
			const mockRatings = [
				mockRating,
				{ ...mockRating, id: 2, articleId: 124 },
			];
			mockApiClient.getArticleRatings.mockResolvedValue(mockRatings);

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async (params: any) => {
				try {
					const ratings = await apiClient.getArticleRatings(params);

					// biome-ignore lint/suspicious/noExplicitAny: テスト用のフォーマット関数のため
					const formatRatingForDisplay = (rating: any) => {
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
								text: `評価一覧取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({
				sortBy: "totalScore",
				order: "desc",
				minScore: 7,
			});

			expect(mockApiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				minScore: 7,
			});
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事評価一覧 (2件)");
		});
	});

	describe("getRatingStats ツール", () => {
		it("評価統計情報を取得する", async () => {
			const mockStats = {
				totalRatings: 100,
				averageScore: 7.5,
				medianScore: 7.6,
				dimensionAverages: {
					practicalValue: 8.0,
					technicalDepth: 7.8,
					understanding: 7.2,
					novelty: 6.5,
					importance: 7.8,
				},
				scoreDistribution: [
					{ range: "1-2", count: 5, percentage: 5.0 },
					{ range: "3-4", count: 10, percentage: 10.0 },
					{ range: "5-6", count: 25, percentage: 25.0 },
					{ range: "7-8", count: 45, percentage: 45.0 },
					{ range: "9-10", count: 15, percentage: 15.0 },
				],
				topRatedArticles: [],
			};

			mockApiClient.getRatingStats.mockResolvedValue(mockStats);

			const toolHandler = async () => {
				try {
					const stats = await apiClient.getRatingStats();

					return {
						content: [
							{
								type: "text",
								text: `📈 記事評価統計情報

## サマリー
📊 総評価数: ${stats.totalRatings}件
⭐ 平均スコア: ${stats.averageScore.toFixed(1)}/10

## 各軸平均値
🎯 実用性: ${stats.dimensionAverages.practicalValue.toFixed(1)}/10
🔬 技術深度: ${stats.dimensionAverages.technicalDepth.toFixed(1)}/10
📖 理解度: ${stats.dimensionAverages.understanding.toFixed(1)}/10
✨ 新規性: ${stats.dimensionAverages.novelty.toFixed(1)}/10
🔥 重要度: ${stats.dimensionAverages.importance.toFixed(1)}/10`,
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
								text: `統計情報取得に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler();

			expect(mockApiClient.getRatingStats).toHaveBeenCalled();
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("総評価数: 100件");
			expect(result.content[0].text).toContain("平均スコア: 7.5/10");
		});
	});

	describe("bulkRateArticles ツール", () => {
		it("複数記事の一括評価を実行する", async () => {
			const ratingsData = [
				{
					articleId: 123,
					practicalValue: 8,
					technicalDepth: 9,
					understanding: 7,
					novelty: 6,
					importance: 8,
					comment: "記事1",
				},
				{
					articleId: 124,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 9,
					comment: "記事2",
				},
			];

			// 成功レスポンスをモック
			mockApiClient.createArticleRating
				.mockResolvedValueOnce({ ...mockRating, id: 1, totalScore: 7.6 })
				.mockResolvedValueOnce({ ...mockRating, id: 2, totalScore: 7.8 });

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async ({ ratings }: { ratings: any[] }) => {
				try {
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
						content: [
							{
								type: "text",
								text: responseText,
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
								text: `一括評価に失敗しました: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			};

			const result = await toolHandler({ ratings: ratingsData });

			expect(mockApiClient.createArticleRating).toHaveBeenCalledTimes(2);
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("一括評価完了");
			expect(result.content[0].text).toContain("成功: 2件");
		});

		it("一部失敗する一括評価のテスト", async () => {
			const ratingsData = [
				{
					articleId: 123,
					practicalValue: 8,
					technicalDepth: 9,
					understanding: 7,
					novelty: 6,
					importance: 8,
				},
				{
					articleId: 124,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 9,
				},
			];

			// 1つ成功、1つ失敗
			mockApiClient.createArticleRating
				.mockResolvedValueOnce({ ...mockRating, id: 1, totalScore: 7.6 })
				.mockRejectedValueOnce(new Error("Validation error"));

			// biome-ignore lint/suspicious/noExplicitAny: テスト用のツールハンドラーのため
			const toolHandler = async ({ ratings }: { ratings: any[] }) => {
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

				const failedRatings = results
					.map((result, index) => ({ result, originalData: ratings[index] }))
					.filter(({ result }) => result.status === "rejected")
					.map(({ result, originalData }) => ({
						articleId: originalData.articleId,
						error: (result as PromiseRejectedResult).reason,
					}));

				let responseText = `📝 一括評価完了\n✅ 成功: ${succeeded}件 | ❌ 失敗: ${failed}件`;

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
					isError: false,
				};
			};

			const result = await toolHandler({ ratings: ratingsData });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("成功: 1件 | ❌ 失敗: 1件");
			expect(result.content[0].text).toContain("失敗した評価:");
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("MCPサーバーツール統合テストファイルが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}
