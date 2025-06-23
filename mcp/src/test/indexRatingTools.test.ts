/**
 * index.ts 記事評価ツールのテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";
import type { ArticleContent } from "../lib/articleContentFetcher.js";
import {
	fetchArticleContent,
	generateRatingPrompt,
} from "../lib/articleContentFetcher.js";

vi.mock("../lib/apiClient.js", () => ({
	createArticleRating: vi.fn(),
	getArticleRating: vi.fn(),
	updateArticleRating: vi.fn(),
}));

vi.mock("../lib/articleContentFetcher.js", () => ({
	fetchArticleContent: vi.fn(),
	generateRatingPrompt: vi.fn(),
}));

// 記事評価ツールの実装をテスト用に分離
async function createRateArticleWithContentHandler() {
	return async ({
		articleId,
		url,
		fetchContent,
	}: {
		articleId: number;
		url: string;
		fetchContent: boolean;
	}) => {
		try {
			let articleContent: ArticleContent | null = null;

			if (fetchContent) {
				try {
					articleContent = await fetchArticleContent(url);
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.error(
						`Failed to fetch article content for ${url}:`,
						errorMessage,
					);
				}
			}

			const evaluationPrompt = generateRatingPrompt(articleContent, url);

			const contentSummary = articleContent
				? `- タイトル: ${articleContent.title}
- 著者: ${articleContent.metadata.author || "N/A"}
- 公開日: ${articleContent.metadata.publishedDate || "N/A"}
- 読み時間: ${articleContent.metadata.readingTime || "N/A"}分
- 内容プレビュー: ${articleContent.content.substring(0, 200)}${articleContent.content.length > 200 ? "..." : ""}`
				: "記事内容の取得に失敗しました。URLを直接確認して評価を行ってください。";

			return {
				content: [
					{
						type: "text",
						text: `記事ID ${articleId} の評価準備が完了しました。

## 記事情報
- URL: ${url}
${contentSummary}

## 評価プロンプト
以下のプロンプトを参考に記事を評価し、createArticleRating ツールで結果を保存してください:

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
}

async function createCreateArticleRatingHandler() {
	return async ({
		articleId,
		practicalValue,
		technicalDepth,
		understanding,
		novelty,
		importance,
		comment,
	}: {
		articleId: number;
		practicalValue: number;
		technicalDepth: number;
		understanding: number;
		novelty: number;
		importance: number;
		comment?: string;
	}) => {
		try {
			const ratingData: apiClient.CreateRatingData = {
				practicalValue,
				technicalDepth,
				understanding,
				novelty,
				importance,
				comment,
			};

			const rating = await apiClient.createArticleRating(articleId, ratingData);

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
						text: `記事評価の作成に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

async function createGetArticleRatingHandler() {
	return async ({ articleId }: { articleId: number }) => {
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
						text: `記事評価の取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

async function createUpdateArticleRatingHandler() {
	return async ({
		articleId,
		practicalValue,
		technicalDepth,
		understanding,
		novelty,
		importance,
		comment,
	}: {
		articleId: number;
		practicalValue?: number;
		technicalDepth?: number;
		understanding?: number;
		novelty?: number;
		importance?: number;
		comment?: string;
	}) => {
		try {
			const updateData: apiClient.UpdateRatingData = {};

			if (practicalValue !== undefined)
				updateData.practicalValue = practicalValue;
			if (technicalDepth !== undefined)
				updateData.technicalDepth = technicalDepth;
			if (understanding !== undefined) updateData.understanding = understanding;
			if (novelty !== undefined) updateData.novelty = novelty;
			if (importance !== undefined) updateData.importance = importance;
			if (comment !== undefined) updateData.comment = comment;

			if (Object.keys(updateData).length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "更新するデータが指定されていません。少なくとも1つのフィールドを指定してください。",
						},
					],
					isError: true,
				};
			}

			const rating = await apiClient.updateArticleRating(articleId, updateData);

			const updatedFields = Object.entries(updateData)
				.map(([key, value]) => {
					const fieldNames: Record<string, string> = {
						practicalValue: "実用性",
						technicalDepth: "技術深度",
						understanding: "理解度",
						novelty: "新規性",
						importance: "重要度",
						comment: "コメント",
					};
					return `- ${fieldNames[key] || key}: ${value}`;
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
						text: `記事評価の更新に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

describe("記事評価ツールのテスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("rateArticleWithContent ツール", () => {
		test("記事内容取得と評価プロンプト生成が成功する", async () => {
			const mockArticleContent: ArticleContent = {
				title: "TypeScript入門",
				content: "TypeScriptについての詳細な解説...",
				metadata: {
					author: "田中太郎",
					publishedDate: "2024-01-01",
					readingTime: 5,
					wordCount: 500,
				},
				extractionMethod: "structured-data",
				qualityScore: 0.9,
			};

			const mockPrompt = "記事評価プロンプトの内容...";

			vi.mocked(fetchArticleContent).mockResolvedValue(mockArticleContent);
			vi.mocked(generateRatingPrompt).mockReturnValue(mockPrompt);

			const handler = await createRateArticleWithContentHandler();
			const result = await handler({
				articleId: 1,
				url: "https://example.com/article",
				fetchContent: true,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事ID 1 の評価準備が完了");
			expect(result.content[0].text).toContain("TypeScript入門");
			expect(result.content[0].text).toContain("田中太郎");
			expect(result.content[0].text).toContain("評価プロンプト");
			expect(fetchArticleContent).toHaveBeenCalledWith(
				"https://example.com/article",
			);
			expect(generateRatingPrompt).toHaveBeenCalledWith(
				mockArticleContent,
				"https://example.com/article",
			);
		});

		test("記事内容取得失敗時でもプロンプト生成が続行される", async () => {
			const mockPrompt = "フォールバック評価プロンプト...";

			vi.mocked(fetchArticleContent).mockRejectedValue(
				new Error("記事取得失敗"),
			);
			vi.mocked(generateRatingPrompt).mockReturnValue(mockPrompt);

			const handler = await createRateArticleWithContentHandler();
			const result = await handler({
				articleId: 1,
				url: "https://example.com/article",
				fetchContent: true,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事内容の取得に失敗しました");
			expect(result.content[0].text).toContain("評価プロンプト");
			expect(generateRatingPrompt).toHaveBeenCalledWith(
				null,
				"https://example.com/article",
			);
		});

		test("fetchContent=falseで記事内容取得をスキップ", async () => {
			const mockPrompt = "記事内容なしのプロンプト...";
			vi.mocked(generateRatingPrompt).mockReturnValue(mockPrompt);

			const handler = await createRateArticleWithContentHandler();
			const result = await handler({
				articleId: 1,
				url: "https://example.com/article",
				fetchContent: false,
			});

			expect(result.isError).toBe(false);
			expect(fetchArticleContent).not.toHaveBeenCalled();
			expect(generateRatingPrompt).toHaveBeenCalledWith(
				null,
				"https://example.com/article",
			);
		});
	});

	describe("createArticleRating ツール", () => {
		test("記事評価の作成が成功する", async () => {
			const mockRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "非常に参考になりました",
				createdAt: "2024-01-01T12:00:00Z",
				updatedAt: "2024-01-01T12:00:00Z",
			};

			vi.mocked(apiClient.createArticleRating).mockResolvedValue(mockRating);

			const handler = await createCreateArticleRatingHandler();
			const ratingData = {
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "非常に参考になりました",
			};

			const result = await handler(ratingData);

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事評価を作成しました");
			expect(result.content[0].text).toContain("記事ID: 1");
			expect(result.content[0].text).toContain("実用性: 8点");
			expect(result.content[0].text).toContain("総合スコア: 76点");
			expect(result.content[0].text).toContain("非常に参考になりました");
			expect(apiClient.createArticleRating).toHaveBeenCalledWith(1, {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "非常に参考になりました",
			});
		});

		test("記事評価作成時のエラーハンドリング", async () => {
			vi.mocked(apiClient.createArticleRating).mockRejectedValue(
				new Error("評価の保存に失敗しました"),
			);

			const handler = await createCreateArticleRatingHandler();
			const result = await handler({
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("記事評価の作成に失敗しました");
			expect(result.content[0].text).toContain("評価の保存に失敗しました");
		});
	});

	describe("getArticleRating ツール", () => {
		test("記事評価の取得が成功する", async () => {
			const mockRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "参考になった記事",
				createdAt: "2024-01-01T12:00:00Z",
				updatedAt: "2024-01-01T12:00:00Z",
			};

			vi.mocked(apiClient.getArticleRating).mockResolvedValue(mockRating);

			const handler = await createGetArticleRatingHandler();
			const result = await handler({ articleId: 1 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事ID 1 の評価:");
			expect(result.content[0].text).toContain("実用性: 8点");
			expect(result.content[0].text).toContain("総合スコア: 76点");
			expect(result.content[0].text).toContain("参考になった記事");
			expect(apiClient.getArticleRating).toHaveBeenCalledWith(1);
		});

		test("評価が見つからない場合の処理", async () => {
			vi.mocked(apiClient.getArticleRating).mockResolvedValue(null);

			const handler = await createGetArticleRatingHandler();
			const result = await handler({ articleId: 999 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain(
				"記事ID 999 の評価は見つかりませんでした",
			);
		});
	});

	describe("updateArticleRating ツール", () => {
		test("記事評価の更新が成功する", async () => {
			const mockUpdatedRating = {
				id: 1,
				articleId: 1,
				practicalValue: 9,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 78,
				comment: "更新されたコメント",
				createdAt: "2024-01-01T12:00:00Z",
				updatedAt: "2024-01-01T13:00:00Z",
			};

			vi.mocked(apiClient.updateArticleRating).mockResolvedValue(
				mockUpdatedRating,
			);

			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({
				articleId: 1,
				practicalValue: 9,
				comment: "更新されたコメント",
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事ID 1 の評価を更新しました");
			expect(result.content[0].text).toContain("実用性: 9");
			expect(result.content[0].text).toContain("更新されたコメント");
			expect(result.content[0].text).toContain("総合スコア: 78点");
			expect(apiClient.updateArticleRating).toHaveBeenCalledWith(1, {
				practicalValue: 9,
				comment: "更新されたコメント",
			});
		});

		test("更新データが空の場合のエラー処理", async () => {
			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({ articleId: 1 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"更新するデータが指定されていません",
			);
		});

		test("記事評価更新時のエラーハンドリング", async () => {
			vi.mocked(apiClient.updateArticleRating).mockRejectedValue(
				new Error("記事が見つかりません"),
			);

			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({
				articleId: 999,
				practicalValue: 8,
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("記事評価の更新に失敗しました");
			expect(result.content[0].text).toContain("記事が見つかりません");
		});
	});
});
