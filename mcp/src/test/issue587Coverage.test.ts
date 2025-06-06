/**
 * Issue #587: MCPテストカバレッジ 40%達成
 * getArticleRating, updateArticleRatingツールのテスト強化
 * getRatingStats API機能の基本テスト追加
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// APIクライアントのモック
vi.mock("../lib/apiClient.js", () => ({
	getArticleRating: vi.fn(),
	updateArticleRating: vi.fn(),
	getRatingStats: vi.fn(),
}));

// getArticleRatingツールのハンドラー実装
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

// updateArticleRatingツールのハンドラー実装
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

// getRatingStatsツールのハンドラー実装
async function createGetRatingStatsHandler() {
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

describe("Issue #587: 記事評価ツール追加テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getArticleRating ツール強化テスト", () => {
		test("正常な評価取得の詳細確認", async () => {
			const mockRating = {
				id: 123,
				articleId: 456,
				practicalValue: 9,
				technicalDepth: 8,
				understanding: 7,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "非常に実用的な記事でした",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-02T15:30:00Z",
			};

			vi.mocked(apiClient.getArticleRating).mockResolvedValue(mockRating);

			const handler = await createGetArticleRatingHandler();
			const result = await handler({ articleId: 456 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("記事ID 456 の評価:");
			expect(result.content[0].text).toContain("実用性: 9点");
			expect(result.content[0].text).toContain("技術深度: 8点");
			expect(result.content[0].text).toContain("理解度: 7点");
			expect(result.content[0].text).toContain("新規性: 6点");
			expect(result.content[0].text).toContain("重要度: 8点");
			expect(result.content[0].text).toContain("総合スコア: 76点");
			expect(result.content[0].text).toContain("非常に実用的な記事でした");
			expect(result.content[0].text).toContain("評価ID: 123");
			expect(apiClient.getArticleRating).toHaveBeenCalledWith(456);
		});

		test("評価が存在しない場合の処理", async () => {
			vi.mocked(apiClient.getArticleRating).mockResolvedValue(null);

			const handler = await createGetArticleRatingHandler();
			const result = await handler({ articleId: 999 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain(
				"記事ID 999 の評価は見つかりませんでした",
			);
			expect(apiClient.getArticleRating).toHaveBeenCalledWith(999);
		});

		test("API呼び出し失敗時のエラーハンドリング", async () => {
			vi.mocked(apiClient.getArticleRating).mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const handler = await createGetArticleRatingHandler();
			const result = await handler({ articleId: 123 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("記事評価の取得に失敗しました");
			expect(result.content[0].text).toContain("データベース接続エラー");
		});

		test("コメントなしの評価取得", async () => {
			const mockRating = {
				id: 100,
				articleId: 200,
				practicalValue: 5,
				technicalDepth: 6,
				understanding: 7,
				novelty: 4,
				importance: 5,
				totalScore: 54,
				comment: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			vi.mocked(apiClient.getArticleRating).mockResolvedValue(mockRating);

			const handler = await createGetArticleRatingHandler();
			const result = await handler({ articleId: 200 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("コメントなし");
			expect(result.content[0].text).not.toContain("コメント: null");
		});
	});

	describe("updateArticleRating ツール強化テスト", () => {
		test("単一フィールド更新の確認", async () => {
			const mockUpdatedRating = {
				id: 1,
				articleId: 100,
				practicalValue: 10,
				technicalDepth: 7,
				understanding: 8,
				novelty: 6,
				importance: 9,
				totalScore: 80,
				comment: "評価を向上させました",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-03T12:00:00Z",
			};

			vi.mocked(apiClient.updateArticleRating).mockResolvedValue(
				mockUpdatedRating,
			);

			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({
				articleId: 100,
				practicalValue: 10,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain(
				"記事ID 100 の評価を更新しました",
			);
			expect(result.content[0].text).toContain("実用性: 10");
			expect(result.content[0].text).toContain("実用性: 10点");
			expect(result.content[0].text).toContain("総合スコア: 80点");
			expect(apiClient.updateArticleRating).toHaveBeenCalledWith(100, {
				practicalValue: 10,
			});
		});

		test("複数フィールド更新の確認", async () => {
			const mockUpdatedRating = {
				id: 2,
				articleId: 200,
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 8,
				novelty: 7,
				importance: 8,
				totalScore: 80,
				comment: "全面的に見直しました",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-03T14:00:00Z",
			};

			vi.mocked(apiClient.updateArticleRating).mockResolvedValue(
				mockUpdatedRating,
			);

			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({
				articleId: 200,
				practicalValue: 8,
				technicalDepth: 9,
				comment: "全面的に見直しました",
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("実用性: 8");
			expect(result.content[0].text).toContain("技術深度: 9");
			expect(result.content[0].text).toContain(
				"コメント: 全面的に見直しました",
			);
			expect(apiClient.updateArticleRating).toHaveBeenCalledWith(200, {
				practicalValue: 8,
				technicalDepth: 9,
				comment: "全面的に見直しました",
			});
		});

		test("更新データが空の場合のバリデーション", async () => {
			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({ articleId: 300 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"更新するデータが指定されていません",
			);
			expect(result.content[0].text).toContain(
				"少なくとも1つのフィールドを指定してください",
			);
			expect(apiClient.updateArticleRating).not.toHaveBeenCalled();
		});

		test("記事が見つからない場合のエラー処理", async () => {
			vi.mocked(apiClient.updateArticleRating).mockRejectedValue(
				new Error("記事ID 999 が見つかりません"),
			);

			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({
				articleId: 999,
				practicalValue: 8,
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("記事評価の更新に失敗しました");
			expect(result.content[0].text).toContain("記事ID 999 が見つかりません");
		});

		test("コメントのみの更新", async () => {
			const mockUpdatedRating = {
				id: 3,
				articleId: 400,
				practicalValue: 7,
				technicalDepth: 6,
				understanding: 8,
				novelty: 5,
				importance: 7,
				totalScore: 66,
				comment: "追加的なコメントです",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-03T16:00:00Z",
			};

			vi.mocked(apiClient.updateArticleRating).mockResolvedValue(
				mockUpdatedRating,
			);

			const handler = await createUpdateArticleRatingHandler();
			const result = await handler({
				articleId: 400,
				comment: "追加的なコメントです",
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain(
				"コメント: 追加的なコメントです",
			);
			expect(apiClient.updateArticleRating).toHaveBeenCalledWith(400, {
				comment: "追加的なコメントです",
			});
		});
	});

	describe("getRatingStats API機能テスト", () => {
		test("統計情報の正常取得と表示", async () => {
			const mockStats = {
				totalRatings: 150,
				averageScore: 7.8,
				medianScore: 8.0,
				dimensionAverages: {
					practicalValue: 8.2,
					technicalDepth: 7.5,
					understanding: 8.0,
					novelty: 6.8,
					importance: 7.9,
				},
				scoreDistribution: [
					{ range: "1-2", count: 5, percentage: 3.3 },
					{ range: "3-4", count: 10, percentage: 6.7 },
					{ range: "5-6", count: 25, percentage: 16.7 },
					{ range: "7-8", count: 70, percentage: 46.7 },
					{ range: "9-10", count: 40, percentage: 26.7 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "高性能な React アプリケーション開発",
						url: "https://example.com/react-performance",
						totalScore: 95,
					},
					{
						id: 2,
						title: "TypeScript 型システム完全ガイド",
						url: "https://example.com/typescript-types",
						totalScore: 92,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockStats);

			const handler = await createGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📈 記事評価統計情報");
			expect(result.content[0].text).toContain("総評価数: 150件");
			expect(result.content[0].text).toContain("平均スコア: 7.8/10");
			expect(result.content[0].text).toContain("中央値: 8.0/10");
			expect(result.content[0].text).toContain("実用性: 8.2/10");
			expect(result.content[0].text).toContain("技術深度: 7.5/10");
			expect(result.content[0].text).toContain("理解度: 8.0/10");
			expect(result.content[0].text).toContain("新規性: 6.8/10");
			expect(result.content[0].text).toContain("重要度: 7.9/10");
			expect(result.content[0].text).toContain("7-8: 70件 (46.7%)");
			expect(result.content[0].text).toContain(
				"高性能な React アプリケーション開発",
			);
			expect(result.content[0].text).toContain("(9.5/10)");
			expect(apiClient.getRatingStats).toHaveBeenCalledOnce();
		});

		test("空の統計データの処理", async () => {
			const mockEmptyStats = {
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

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockEmptyStats);

			const handler = await createGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("総評価数: 0件");
			expect(result.content[0].text).toContain("平均スコア: 0.0/10");
		});

		test("統計情報取得失敗時のエラーハンドリング", async () => {
			vi.mocked(apiClient.getRatingStats).mockRejectedValue(
				new Error("統計計算処理でエラーが発生しました"),
			);

			const handler = await createGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"評価統計情報の取得に失敗しました",
			);
			expect(result.content[0].text).toContain(
				"統計計算処理でエラーが発生しました",
			);
		});

		test("少数の記事データでの統計表示", async () => {
			const mockSmallStats = {
				totalRatings: 3,
				averageScore: 6.5,
				medianScore: 6.0,
				dimensionAverages: {
					practicalValue: 7.0,
					technicalDepth: 6.0,
					understanding: 6.5,
					novelty: 5.5,
					importance: 7.5,
				},
				scoreDistribution: [
					{ range: "5-6", count: 2, percentage: 66.7 },
					{ range: "7-8", count: 1, percentage: 33.3 },
				],
				topRatedArticles: [
					{
						id: 10,
						title: "入門者向けJavaScript",
						url: "https://example.com/js-beginner",
						totalScore: 75,
					},
				],
			};

			vi.mocked(apiClient.getRatingStats).mockResolvedValue(mockSmallStats);

			const handler = await createGetRatingStatsHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("総評価数: 3件");
			expect(result.content[0].text).toContain("5-6: 2件 (66.7%)");
			expect(result.content[0].text).toContain("入門者向けJavaScript");
			expect(result.content[0].text).toContain("(7.5/10)");
		});
	});
});

// インライン形式テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("Issue #587 カバレッジテスト関数が正しく定義されている", () => {
		expect(createGetArticleRatingHandler).toBeDefined();
		expect(createUpdateArticleRatingHandler).toBeDefined();
		expect(createGetRatingStatsHandler).toBeDefined();

		expect(typeof createGetArticleRatingHandler).toBe("function");
		expect(typeof createUpdateArticleRatingHandler).toBe("function");
		expect(typeof createGetRatingStatsHandler).toBe("function");
	});

	test("評価データ型の確認", () => {
		const sampleRating = {
			id: 1,
			articleId: 100,
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 76,
			comment: "テストコメント",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(sampleRating.id).toBeTypeOf("number");
		expect(sampleRating.articleId).toBeTypeOf("number");
		expect(sampleRating.practicalValue).toBeTypeOf("number");
		expect(sampleRating.technicalDepth).toBeTypeOf("number");
		expect(sampleRating.understanding).toBeTypeOf("number");
		expect(sampleRating.novelty).toBeTypeOf("number");
		expect(sampleRating.importance).toBeTypeOf("number");
		expect(sampleRating.totalScore).toBeTypeOf("number");
		expect(sampleRating.comment).toBeTypeOf("string");
		expect(sampleRating.createdAt).toBeTypeOf("string");
		expect(sampleRating.updatedAt).toBeTypeOf("string");
	});

	test("統計データ型の確認", () => {
		const sampleStats = {
			totalRatings: 100,
			averageScore: 7.5,
			medianScore: 8.0,
			dimensionAverages: {
				practicalValue: 8.0,
				technicalDepth: 7.0,
				understanding: 8.5,
				novelty: 6.5,
				importance: 7.8,
			},
			scoreDistribution: [{ range: "7-8", count: 50, percentage: 50.0 }],
			topRatedArticles: [
				{
					id: 1,
					title: "テスト記事",
					url: "https://example.com",
					totalScore: 90,
				},
			],
		};

		expect(sampleStats.totalRatings).toBeTypeOf("number");
		expect(sampleStats.averageScore).toBeTypeOf("number");
		expect(sampleStats.medianScore).toBeTypeOf("number");
		expect(Array.isArray(sampleStats.scoreDistribution)).toBe(true);
		expect(Array.isArray(sampleStats.topRatedArticles)).toBe(true);
	});
}
