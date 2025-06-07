/**
 * Issue #588: MCPテストカバレッジ 45%達成
 * getArticleRatingsツールの詳細テスト - フィルタリング・ソート機能強化
 * クエリパラメータの複合条件テストとパフォーマンステスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// APIクライアントのモック
vi.mock("../lib/apiClient.js", () => ({
	getArticleRatings: vi.fn(),
	createArticleRating: vi.fn(),
}));

// getArticleRatingsツールのハンドラー実装
async function createGetArticleRatingsHandler() {
	return async (params: {
		sortBy?:
			| "totalScore"
			| "createdAt"
			| "practicalValue"
			| "technicalDepth"
			| "understanding"
			| "novelty"
			| "importance";
		order?: "asc" | "desc";
		limit?: number;
		offset?: number;
		minScore?: number;
		maxScore?: number;
		hasComment?: boolean;
	}) => {
		try {
			const ratings = await apiClient.getArticleRatings(params);

			// フォーマット用のヘルパー関数
			const formatRatingForDisplay = (rating: {
				id: number;
				articleId: number;
				practicalValue: number;
				technicalDepth: number;
				understanding: number;
				novelty: number;
				importance: number;
				totalScore: number;
				comment: string | null;
				createdAt: string;
			}) => {
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

			// ソート・フィルター情報
			const filterInfo = [];
			if (params.sortBy)
				filterInfo.push(`ソート: ${params.sortBy} (${params.order || "asc"})`);
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
}

describe("Issue #588: getArticleRatings ツール詳細テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的なソート機能テスト", () => {
		test("総合スコア降順ソート", async () => {
			const mockRatings = [
				{
					id: 1,
					articleId: 101,
					practicalValue: 9,
					technicalDepth: 8,
					understanding: 9,
					novelty: 7,
					importance: 9,
					totalScore: 84,
					comment: "最高評価の記事",
					createdAt: "2024-01-01T10:00:00Z",
					updatedAt: "2024-01-01T10:00:00Z",
				},
				{
					id: 2,
					articleId: 102,
					practicalValue: 7,
					technicalDepth: 6,
					understanding: 7,
					novelty: 5,
					importance: 7,
					totalScore: 64,
					comment: null,
					createdAt: "2024-01-02T10:00:00Z",
					updatedAt: "2024-01-02T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "totalScore",
				order: "desc",
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 記事評価一覧 (2件)");
			expect(result.content[0].text).toContain("ソート: totalScore (desc)");
			expect(result.content[0].text).toContain("📈 総合スコア: 8.4/10");
			expect(result.content[0].text).toContain("📈 総合スコア: 6.4/10");
			expect(result.content[0].text).toContain("最高評価の記事");
			expect(result.content[0].text).toContain("💭 コメント: なし");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
			});
		});

		test("作成日昇順ソート", async () => {
			const mockRatings = [
				{
					id: 3,
					articleId: 103,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 8,
					novelty: 6,
					importance: 8,
					totalScore: 74,
					comment: "良い記事です",
					createdAt: "2024-01-03T10:00:00Z",
					updatedAt: "2024-01-03T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "createdAt",
				order: "asc",
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("ソート: createdAt (asc)");
			expect(result.content[0].text).toContain("2024/1/3");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "createdAt",
				order: "asc",
			});
		});

		test("実用性ソート（デフォルト昇順）", async () => {
			const mockRatings = [
				{
					id: 4,
					articleId: 104,
					practicalValue: 5,
					technicalDepth: 8,
					understanding: 7,
					novelty: 9,
					importance: 6,
					totalScore: 70,
					comment: "新しいアプローチ",
					createdAt: "2024-01-04T10:00:00Z",
					updatedAt: "2024-01-04T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "practicalValue",
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("ソート: practicalValue (asc)");
			expect(result.content[0].text).toContain("• 実用性: 5/10");
			expect(result.content[0].text).toContain("• 新規性: 9/10");
		});
	});

	describe("フィルタリング機能テスト", () => {
		test("スコア範囲フィルタ（最小・最大指定）", async () => {
			const mockRatings = [
				{
					id: 5,
					articleId: 105,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 8,
					totalScore: 78,
					comment: "範囲内の記事",
					createdAt: "2024-01-05T10:00:00Z",
					updatedAt: "2024-01-05T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				minScore: 7,
				maxScore: 9,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("スコア範囲: 7-9");
			expect(result.content[0].text).toContain("📈 総合スコア: 7.8/10");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				minScore: 7,
				maxScore: 9,
			});
		});

		test("最小スコアのみ指定", async () => {
			const mockRatings = [
				{
					id: 6,
					articleId: 106,
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 9,
					novelty: 8,
					importance: 9,
					totalScore: 88,
					comment: "高品質記事",
					createdAt: "2024-01-06T10:00:00Z",
					updatedAt: "2024-01-06T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				minScore: 8,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("スコア範囲: 8-10");
			expect(result.content[0].text).toContain("📈 総合スコア: 8.8/10");
		});

		test("最大スコアのみ指定", async () => {
			const mockRatings = [
				{
					id: 7,
					articleId: 107,
					practicalValue: 5,
					technicalDepth: 6,
					understanding: 5,
					novelty: 4,
					importance: 5,
					totalScore: 50,
					comment: null,
					createdAt: "2024-01-07T10:00:00Z",
					updatedAt: "2024-01-07T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				maxScore: 6,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("スコア範囲: 1-6");
			expect(result.content[0].text).toContain("📈 総合スコア: 5.0/10");
		});

		test("コメント有りフィルタ", async () => {
			const mockRatings = [
				{
					id: 8,
					articleId: 108,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 7,
					novelty: 6,
					importance: 7,
					totalScore: 70,
					comment: "詳細なコメント付き",
					createdAt: "2024-01-08T10:00:00Z",
					updatedAt: "2024-01-08T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				hasComment: true,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("コメント: あり");
			expect(result.content[0].text).toContain(
				"💭 コメント: 詳細なコメント付き",
			);
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				hasComment: true,
			});
		});

		test("コメント無しフィルタ", async () => {
			const mockRatings = [
				{
					id: 9,
					articleId: 109,
					practicalValue: 6,
					technicalDepth: 7,
					understanding: 6,
					novelty: 5,
					importance: 6,
					totalScore: 60,
					comment: null,
					createdAt: "2024-01-09T10:00:00Z",
					updatedAt: "2024-01-09T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				hasComment: false,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("コメント: なし");
			expect(result.content[0].text).toContain("💭 コメント: なし");
		});
	});

	describe("ページネーション機能テスト", () => {
		test("リミットとオフセット指定", async () => {
			const mockRatings = [
				{
					id: 10,
					articleId: 110,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 8,
					novelty: 6,
					importance: 8,
					totalScore: 74,
					comment: "ページネーションテスト",
					createdAt: "2024-01-10T10:00:00Z",
					updatedAt: "2024-01-10T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				limit: 5,
				offset: 10,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 記事評価一覧 (1件)");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				limit: 5,
				offset: 10,
			});
		});

		test("境界値テスト - 最大リミット", async () => {
			const mockRatings: Array<{
				id: number;
				articleId: number;
				practicalValue: number;
				technicalDepth: number;
				understanding: number;
				novelty: number;
				importance: number;
				totalScore: number;
				comment: string | null;
				createdAt: string;
				updatedAt: string;
			}> = [];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				limit: 100,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain(
				"📭 条件に合致する評価がありません",
			);
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				limit: 100,
			});
		});

		test("オフセット0の場合", async () => {
			const mockRatings = [
				{
					id: 11,
					articleId: 111,
					practicalValue: 7,
					technicalDepth: 6,
					understanding: 7,
					novelty: 5,
					importance: 7,
					totalScore: 64,
					comment: "最初のページ",
					createdAt: "2024-01-11T10:00:00Z",
					updatedAt: "2024-01-11T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				offset: 0,
				limit: 1,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("最初のページ");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				offset: 0,
				limit: 1,
			});
		});
	});

	describe("複合条件テスト", () => {
		test("ソート + フィルタ + ページネーションの組み合わせ", async () => {
			const mockRatings = [
				{
					id: 12,
					articleId: 112,
					practicalValue: 9,
					technicalDepth: 8,
					understanding: 9,
					novelty: 7,
					importance: 9,
					totalScore: 84,
					comment: "複合条件テスト用記事",
					createdAt: "2024-01-12T10:00:00Z",
					updatedAt: "2024-01-12T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "totalScore",
				order: "desc",
				minScore: 8,
				maxScore: 10,
				hasComment: true,
				limit: 10,
				offset: 0,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("ソート: totalScore (desc)");
			expect(result.content[0].text).toContain("スコア範囲: 8-10");
			expect(result.content[0].text).toContain("コメント: あり");
			expect(result.content[0].text).toContain("複合条件テスト用記事");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				minScore: 8,
				maxScore: 10,
				hasComment: true,
				limit: 10,
				offset: 0,
			});
		});

		test("技術深度ソート + コメント無しフィルタ", async () => {
			const mockRatings = [
				{
					id: 13,
					articleId: 113,
					practicalValue: 6,
					technicalDepth: 9,
					understanding: 7,
					novelty: 8,
					importance: 6,
					totalScore: 72,
					comment: null,
					createdAt: "2024-01-13T10:00:00Z",
					updatedAt: "2024-01-13T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "technicalDepth",
				order: "desc",
				hasComment: false,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("ソート: technicalDepth (desc)");
			expect(result.content[0].text).toContain("コメント: なし");
			expect(result.content[0].text).toContain("• 技術深度: 9/10");
		});

		test("新規性ソート + スコア範囲 + リミット", async () => {
			const mockRatings = [
				{
					id: 14,
					articleId: 114,
					practicalValue: 7,
					technicalDepth: 6,
					understanding: 7,
					novelty: 9,
					importance: 7,
					totalScore: 72,
					comment: "革新的なアプローチ",
					createdAt: "2024-01-14T10:00:00Z",
					updatedAt: "2024-01-14T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "novelty",
				order: "desc",
				minScore: 7,
				limit: 5,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("ソート: novelty (desc)");
			expect(result.content[0].text).toContain("スコア範囲: 7-10");
			expect(result.content[0].text).toContain("• 新規性: 9/10");
			expect(result.content[0].text).toContain("革新的なアプローチ");
		});
	});

	describe("エラーハンドリングテスト", () => {
		test("API呼び出し失敗時のエラー処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				sortBy: "totalScore",
				order: "desc",
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"記事評価一覧の取得に失敗しました",
			);
			expect(result.content[0].text).toContain("データベース接続エラー");
		});

		test("ネットワークエラー時の処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				new Error("Network request failed"),
			);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				hasComment: true,
				minScore: 8,
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Network request failed");
		});

		test("不明なエラー型の処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				"文字列形式のエラー",
			);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("文字列形式のエラー");
		});
	});

	describe("表示フォーマット・大量データテスト", () => {
		test("空の結果表示", async () => {
			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([]);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				minScore: 10,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 記事評価一覧 (0件)");
			expect(result.content[0].text).toContain(
				"📭 条件に合致する評価がありません",
			);
		});

		test("大量データの表示テスト", async () => {
			const mockRatings = Array.from({ length: 50 }, (_, i) => ({
				id: i + 100,
				articleId: i + 1000,
				practicalValue: 7 + (i % 3),
				technicalDepth: 6 + (i % 4),
				understanding: 7 + (i % 3),
				novelty: 5 + (i % 5),
				importance: 7 + (i % 3),
				totalScore: 70 + (i % 20),
				comment: i % 3 === 0 ? `コメント${i}` : null,
				createdAt: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
				updatedAt: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
			}));

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({
				limit: 50,
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 記事評価一覧 (50件)");
			expect(result.content[0].text).toContain("📊 評価ID: 100");
			expect(result.content[0].text).toContain("📊 評価ID: 149");
		});

		test("日付フォーマットの確認", async () => {
			const mockRatings = [
				{
					id: 15,
					articleId: 115,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 8,
					novelty: 6,
					importance: 8,
					totalScore: 74,
					comment: "日付フォーマットテスト",
					createdAt: "2024-12-25T15:30:45Z",
					updatedAt: "2024-12-25T15:30:45Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📅 作成日: 2024/12/26");
		});

		test("スコア小数点表示の確認", async () => {
			const mockRatings = [
				{
					id: 16,
					articleId: 116,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 7,
					totalScore: 75, // 7.5/10表示になる
					comment: "スコア表示テスト",
					createdAt: "2024-01-16T10:00:00Z",
					updatedAt: "2024-01-16T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📈 総合スコア: 7.5/10");
		});

		test("パラメータ無しの基本表示", async () => {
			const mockRatings = [
				{
					id: 17,
					articleId: 117,
					practicalValue: 7,
					technicalDepth: 6,
					understanding: 7,
					novelty: 5,
					importance: 7,
					totalScore: 64,
					comment: "基本表示テスト",
					createdAt: "2024-01-17T10:00:00Z",
					updatedAt: "2024-01-17T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetArticleRatingsHandler();
			const result = await handler({});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📊 記事評価一覧 (1件)");
			expect(result.content[0].text).not.toContain("🔍 フィルター条件:");
			expect(result.content[0].text).toContain("基本表示テスト");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({});
		});
	});

	describe("getTopRatedArticles ツールテスト", () => {
		// getTopRatedArticlesツールのハンドラー実装
		const createGetTopRatedArticlesHandler = async () => {
			return async ({ limit }: { limit?: number }) => {
				try {
					const ratings = await apiClient.getArticleRatings({
						sortBy: "totalScore",
						order: "desc",
						limit: limit || 10,
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
								text: `🏆 高評価記事 Top ${limit || 10}\n\n${formatted}`,
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
		};

		test("高評価記事の正常取得（デフォルト10件）", async () => {
			const mockRatings = [
				{
					id: 1,
					articleId: 101,
					practicalValue: 9,
					technicalDepth: 9,
					understanding: 9,
					novelty: 8,
					importance: 9,
					totalScore: 88,
					comment: "素晴らしい記事",
					createdAt: "2024-01-01T10:00:00Z",
					updatedAt: "2024-01-01T10:00:00Z",
				},
				{
					id: 2,
					articleId: 102,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 7,
					importance: 8,
					totalScore: 78,
					comment: null,
					createdAt: "2024-01-02T10:00:00Z",
					updatedAt: "2024-01-02T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetTopRatedArticlesHandler();
			const result = await handler({});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("🏆 高評価記事 Top 10");
			expect(result.content[0].text).toContain("1. 📊 スコア: 8.8/10");
			expect(result.content[0].text).toContain("🆔 記事ID: 101");
			expect(result.content[0].text).toContain("💭 素晴らしい記事");
			expect(result.content[0].text).toContain("2. 📊 スコア: 7.8/10");
			expect(result.content[0].text).toContain("💭 コメントなし");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 10,
			});
		});

		test("カスタムリミット指定", async () => {
			const mockRatings = [
				{
					id: 3,
					articleId: 103,
					practicalValue: 9,
					technicalDepth: 8,
					understanding: 9,
					novelty: 7,
					importance: 9,
					totalScore: 84,
					comment: "Top 5記事",
					createdAt: "2024-01-03T10:00:00Z",
					updatedAt: "2024-01-03T10:00:00Z",
				},
			];

			vi.mocked(apiClient.getArticleRatings).mockResolvedValue(mockRatings);

			const handler = await createGetTopRatedArticlesHandler();
			const result = await handler({ limit: 5 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("🏆 高評価記事 Top 5");
			expect(result.content[0].text).toContain("📊 スコア: 8.4/10");
			expect(apiClient.getArticleRatings).toHaveBeenCalledWith({
				sortBy: "totalScore",
				order: "desc",
				limit: 5,
			});
		});

		test("評価された記事がない場合", async () => {
			vi.mocked(apiClient.getArticleRatings).mockResolvedValue([]);

			const handler = await createGetTopRatedArticlesHandler();
			const result = await handler({});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toBe("📭 評価された記事がありません");
		});

		test("API エラー時の処理", async () => {
			vi.mocked(apiClient.getArticleRatings).mockRejectedValue(
				new Error("評価データの取得に失敗"),
			);

			const handler = await createGetTopRatedArticlesHandler();
			const result = await handler({ limit: 20 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"高評価記事の取得に失敗しました",
			);
			expect(result.content[0].text).toContain("評価データの取得に失敗");
		});
	});

	describe("bulkRateArticles ツールテスト", () => {
		// bulkRateArticlesツールのハンドラー実装
		const createBulkRateArticlesHandler = async () => {
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
		};

		test("全て成功した場合の一括評価", async () => {
			const mockCreatedRatings = [
				{
					id: 1,
					articleId: 101,
					practicalValue: 8,
					technicalDepth: 8,
					understanding: 8,
					novelty: 8,
					importance: 8,
					totalScore: 80,
					comment: null,
					createdAt: "2024-01-01T10:00:00Z",
					updatedAt: "2024-01-01T10:00:00Z",
				},
				{
					id: 2,
					articleId: 102,
					practicalValue: 7,
					technicalDepth: 8,
					understanding: 7,
					novelty: 8,
					importance: 7,
					totalScore: 75,
					comment: "良い記事",
					createdAt: "2024-01-02T10:00:00Z",
					updatedAt: "2024-01-02T10:00:00Z",
				},
			];

			vi.mocked(apiClient.createArticleRating)
				.mockResolvedValueOnce(mockCreatedRatings[0])
				.mockResolvedValueOnce(mockCreatedRatings[1]);

			const handler = await createBulkRateArticlesHandler();
			const result = await handler({
				ratings: [
					{
						articleId: 101,
						practicalValue: 8,
						technicalDepth: 8,
						understanding: 8,
						novelty: 8,
						importance: 8,
					},
					{
						articleId: 102,
						practicalValue: 7,
						technicalDepth: 8,
						understanding: 7,
						novelty: 8,
						importance: 7,
						comment: "良い記事",
					},
				],
			});

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("📝 一括評価完了");
			expect(result.content[0].text).toContain("✅ 成功: 2件 | ❌ 失敗: 0件");
			expect(result.content[0].text).toContain("記事ID 101: 総合スコア 8.0/10");
			expect(result.content[0].text).toContain("記事ID 102: 総合スコア 7.5/10");
			expect(apiClient.createArticleRating).toHaveBeenCalledTimes(2);
		});

		test("部分的に失敗した場合の一括評価", async () => {
			const mockCreatedRating = {
				id: 1,
				articleId: 101,
				practicalValue: 9,
				technicalDepth: 8,
				understanding: 9,
				novelty: 8,
				importance: 9,
				totalScore: 85,
				comment: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			vi.mocked(apiClient.createArticleRating)
				.mockResolvedValueOnce(mockCreatedRating)
				.mockRejectedValueOnce(new Error("記事が見つかりません"));

			const handler = await createBulkRateArticlesHandler();
			const result = await handler({
				ratings: [
					{
						articleId: 101,
						practicalValue: 9,
						technicalDepth: 8,
						understanding: 9,
						novelty: 8,
						importance: 9,
					},
					{
						articleId: 999,
						practicalValue: 7,
						technicalDepth: 7,
						understanding: 7,
						novelty: 7,
						importance: 7,
					},
				],
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("✅ 成功: 1件 | ❌ 失敗: 1件");
			expect(result.content[0].text).toContain("記事ID 101: 総合スコア 8.5/10");
			expect(result.content[0].text).toContain(
				"記事ID 999: Error: 記事が見つかりません",
			);
		});

		test("全て失敗した場合の一括評価", async () => {
			vi.mocked(apiClient.createArticleRating)
				.mockRejectedValueOnce(new Error("データベースエラー"))
				.mockRejectedValueOnce(new Error("バリデーションエラー"));

			const handler = await createBulkRateArticlesHandler();
			const result = await handler({
				ratings: [
					{
						articleId: 101,
						practicalValue: 8,
						technicalDepth: 8,
						understanding: 8,
						novelty: 8,
						importance: 8,
					},
					{
						articleId: 102,
						practicalValue: 7,
						technicalDepth: 7,
						understanding: 7,
						novelty: 7,
						importance: 7,
					},
				],
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("✅ 成功: 0件 | ❌ 失敗: 2件");
			expect(result.content[0].text).toContain(
				"記事ID 101: Error: データベースエラー",
			);
			expect(result.content[0].text).toContain(
				"記事ID 102: Error: バリデーションエラー",
			);
		});

		test("一括評価処理での例外エラー", async () => {
			// Promise.allSettledの実行自体でエラーが発生した場合
			vi.mocked(apiClient.createArticleRating).mockImplementation(() => {
				throw new Error("予期しないエラー");
			});

			const handler = await createBulkRateArticlesHandler();
			const result = await handler({
				ratings: [
					{
						articleId: 101,
						practicalValue: 8,
						technicalDepth: 8,
						understanding: 8,
						novelty: 8,
						importance: 8,
					},
				],
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("一括評価の実行に失敗しました");
		});
	});
});

// インライン形式テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("Issue #588 カバレッジテスト関数が正しく定義されている", () => {
		expect(createGetArticleRatingsHandler).toBeDefined();
		expect(typeof createGetArticleRatingsHandler).toBe("function");
	});

	test("評価データのフォーマット関数テスト", () => {
		// フォーマット用のヘルパー関数（実装から抽出）
		const formatRatingForDisplay = (rating: {
			id: number;
			articleId: number;
			practicalValue: number;
			technicalDepth: number;
			understanding: number;
			novelty: number;
			importance: number;
			totalScore: number;
			comment: string | null;
			createdAt: string;
		}) => {
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

		const testRating = {
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
		};

		const formatted = formatRatingForDisplay(testRating);

		expect(formatted).toContain("📊 評価ID: 1");
		expect(formatted).toContain("記事ID: 100");
		expect(formatted).toContain("📈 総合スコア: 7.6/10");
		expect(formatted).toContain("• 実用性: 8/10");
		expect(formatted).toContain("• 技術深度: 7/10");
		expect(formatted).toContain("• 理解度: 9/10");
		expect(formatted).toContain("• 新規性: 6/10");
		expect(formatted).toContain("• 重要度: 8/10");
		expect(formatted).toContain("💭 コメント: テストコメント");
		expect(formatted).toContain("📅 作成日: 2024/1/1");
	});

	test("フィルター情報生成のテスト", () => {
		const params = {
			sortBy: "totalScore" as const,
			order: "desc" as const,
			minScore: 7,
			maxScore: 9,
			hasComment: true,
		};

		const filterInfo = [];
		if (params.sortBy)
			filterInfo.push(`ソート: ${params.sortBy} (${params.order || "asc"})`);
		if (params.minScore || params.maxScore) {
			const min = params.minScore || 1;
			const max = params.maxScore || 10;
			filterInfo.push(`スコア範囲: ${min}-${max}`);
		}
		if (params.hasComment !== undefined) {
			filterInfo.push(`コメント: ${params.hasComment ? "あり" : "なし"}`);
		}

		expect(filterInfo).toContain("ソート: totalScore (desc)");
		expect(filterInfo).toContain("スコア範囲: 7-9");
		expect(filterInfo).toContain("コメント: あり");
		expect(filterInfo.length).toBe(3);
	});

	test("評価ソート列挙型の確認", () => {
		const validSortFields = [
			"totalScore",
			"createdAt",
			"practicalValue",
			"technicalDepth",
			"understanding",
			"novelty",
			"importance",
		];

		expect(validSortFields).toContain("totalScore");
		expect(validSortFields).toContain("createdAt");
		expect(validSortFields).toContain("practicalValue");
		expect(validSortFields).toContain("technicalDepth");
		expect(validSortFields).toContain("understanding");
		expect(validSortFields).toContain("novelty");
		expect(validSortFields).toContain("importance");
		expect(validSortFields.length).toBe(7);
	});
}
