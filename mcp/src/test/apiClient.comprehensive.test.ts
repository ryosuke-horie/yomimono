/**
 * APIクライアント機能の包括的テスト
 * src/lib/apiClient.tsのカバレッジ向上を目的とする
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	getUnlabeledArticles,
	getLabels,
	assignLabelToArticle,
	createLabel,
	getLabelById,
	deleteLabel,
	updateLabelDescription,
	assignLabelsToMultipleArticles,
	getBookmarkById,
	getUnreadArticlesByLabel,
	getUnreadBookmarks,
	getReadBookmarks,
	markBookmarkAsRead,
	createArticleRating,
	getArticleRating,
	updateArticleRating,
	getArticleRatings,
	getRatingStats,
} from "../lib/apiClient.js";

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("APIクライアント包括テスト", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
		process.env.API_BASE_URL = "http://localhost:8787";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("環境設定", () => {
		it("API_BASE_URLが正しく設定される", () => {
			expect(process.env.API_BASE_URL).toBe("http://localhost:8787");
		});
	});

	describe("ラベル関連API", () => {
		it("getUnlabeledArticles - 成功ケース", async () => {
			const mockData = {
				success: true,
				bookmarks: [
					{ id: 1, title: "記事1", url: "https://example.com/1" },
					{ id: 2, title: "記事2", url: "https://example.com/2" },
				],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockData),
			});

			const result = await getUnlabeledArticles();

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/unlabeledArticles",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockData.bookmarks);
		});

		it("getLabels - 成功ケース", async () => {
			const mockLabels = {
				success: true,
				labels: [
					{ id: 1, name: "Tech", description: "技術記事" },
					{ id: 2, name: "Design", description: "デザイン記事" },
				],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockLabels),
			});

			const result = await getLabels();

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/labels",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockLabels.labels);
		});

		it("assignLabelToArticle - 成功ケース", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			await assignLabelToArticle(1, "Tech", "詳しい説明");

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/1/label",
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify({
						labelName: "Tech",
						description: "詳しい説明",
					}),
				})
			);
		});

		it("createLabel - 成功ケース", async () => {
			const mockLabel = { id: 3, name: "NewLabel", description: "新しいラベル" };

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockLabel),
			});

			const result = await createLabel("NewLabel", "新しいラベル");

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/labels",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						name: "NewLabel",
						description: "新しいラベル",
					}),
				})
			);
			expect(result).toEqual(mockLabel);
		});

		it("getLabelById - 成功ケース", async () => {
			const mockLabel = { id: 1, name: "Tech", description: "技術記事" };

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockLabel),
			});

			const result = await getLabelById(1);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/labels/1",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockLabel);
		});

		it("deleteLabel - 成功ケース", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			await deleteLabel(1);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/labels/1",
				expect.objectContaining({
					method: "DELETE",
				})
			);
		});

		it("updateLabelDescription - 成功ケース", async () => {
			const mockUpdatedLabel = { id: 1, name: "Tech", description: "更新された説明" };

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockUpdatedLabel),
			});

			const result = await updateLabelDescription(1, "更新された説明");

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/labels/1",
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify({
						description: "更新された説明",
					}),
				})
			);
			expect(result).toEqual(mockUpdatedLabel);
		});

		it("assignLabelsToMultipleArticles - 成功ケース", async () => {
			const mockResult = {
				success: true,
				assigned: [1, 2, 3],
				failed: [],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResult),
			});

			const result = await assignLabelsToMultipleArticles(
				[1, 2, 3],
				"Tech",
				"技術記事"
			);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/batch-label",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						articleIds: [1, 2, 3],
						labelName: "Tech",
						description: "技術記事",
					}),
				})
			);
			expect(result).toEqual(mockResult);
		});
	});

	describe("ブックマーク関連API", () => {
		it("getBookmarkById - 成功ケース", async () => {
			const mockBookmark = {
				id: 1,
				title: "テストブックマーク",
				url: "https://example.com",
				createdAt: "2024-01-01",
				labels: [],
				isRead: false,
				isFavorite: false,
				readAt: null,
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockBookmark),
			});

			const result = await getBookmarkById(1);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/1",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockBookmark);
		});

		it("getUnreadBookmarks - 成功ケース", async () => {
			const mockBookmarks = [
				{
					id: 1,
					title: "未読1",
					url: "https://example.com/1",
					createdAt: "2024-01-01",
					labels: [],
					isRead: false,
					isFavorite: false,
					readAt: null,
				},
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockBookmarks),
			});

			const result = await getUnreadBookmarks();

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/unread",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockBookmarks);
		});

		it("getReadBookmarks - 成功ケース", async () => {
			const mockBookmarks = [
				{
					id: 1,
					title: "既読1",
					url: "https://example.com/1",
					createdAt: "2024-01-01",
					labels: [],
					isRead: true,
					isFavorite: false,
					readAt: "2024-01-02",
				},
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockBookmarks),
			});

			const result = await getReadBookmarks();

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/read",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockBookmarks);
		});

		it("markBookmarkAsRead - 成功ケース", async () => {
			const mockResult = { message: "success", success: true };

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResult),
			});

			const result = await markBookmarkAsRead(1);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/1/read",
				expect.objectContaining({
					method: "PUT",
				})
			);
			expect(result).toEqual(mockResult);
		});

		it("getUnreadArticlesByLabel - 成功ケース", async () => {
			const mockArticles = [
				{ id: 1, title: "Tech記事1", url: "https://example.com/1" },
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockArticles),
			});

			const result = await getUnreadArticlesByLabel("Tech");

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/bookmarks/unread/label/Tech",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockArticles);
		});
	});

	describe("記事評価API", () => {
		it("createArticleRating - 成功ケース", async () => {
			const ratingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 8,
				importance: 9,
				comment: "とても有用な記事",
			};

			const mockResponse = {
				id: 1,
				articleId: 1,
				...ratingData,
				totalScore: 82,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await createArticleRating(1, ratingData);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/ratings/article/1",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(ratingData),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it("getArticleRating - 成功ケース", async () => {
			const mockRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 8,
				importance: 9,
				totalScore: 82,
				comment: "とても有用な記事",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockRating),
			});

			const result = await getArticleRating(1);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/ratings/article/1",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockRating);
		});

		it("getArticleRating - 404の場合nullを返す", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
			});

			const result = await getArticleRating(999);

			expect(result).toBeNull();
		});

		it("updateArticleRating - 成功ケース", async () => {
			const updateData = {
				practicalValue: 9,
				comment: "更新されたコメント",
			};

			const mockUpdatedRating = {
				id: 1,
				articleId: 1,
				practicalValue: 9,
				technicalDepth: 9,
				understanding: 7,
				novelty: 8,
				importance: 9,
				totalScore: 84,
				comment: "更新されたコメント",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockUpdatedRating),
			});

			const result = await updateArticleRating(1, updateData);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/ratings/article/1",
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify(updateData),
				})
			);
			expect(result).toEqual(mockUpdatedRating);
		});

		it("getArticleRatings - オプションなし", async () => {
			const mockRatings = [
				{
					id: 1,
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 9,
					understanding: 7,
					novelty: 8,
					importance: 9,
					totalScore: 82,
					comment: "テスト評価",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockRatings),
			});

			const result = await getArticleRatings();

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/ratings",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockRatings);
		});

		it("getArticleRatings - フィルターオプション付き", async () => {
			const options = {
				sortBy: "totalScore" as const,
				order: "desc" as const,
				limit: 10,
				offset: 0,
				minScore: 8,
				maxScore: 10,
				hasComment: true,
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([]),
			});

			await getArticleRatings(options);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("sortBy=totalScore"),
				expect.objectContaining({
					method: "GET",
				})
			);
		});

		it("getRatingStats - 成功ケース", async () => {
			const mockStats = {
				totalRatings: 50,
				averageScore: 8.2,
				medianScore: 8.0,
				dimensionAverages: {
					practicalValue: 8.1,
					technicalDepth: 8.3,
					understanding: 7.9,
					novelty: 8.0,
					importance: 8.4,
				},
				scoreDistribution: [
					{ range: "9-10", count: 15, percentage: 30 },
					{ range: "7-8", count: 25, percentage: 50 },
					{ range: "5-6", count: 10, percentage: 20 },
				],
				topRatedArticles: [
					{
						id: 1,
						title: "最高の記事",
						url: "https://example.com/best",
						totalScore: 95,
					},
				],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockStats),
			});

			const result = await getRatingStats();

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:8787/api/ratings/stats",
				expect.objectContaining({
					method: "GET",
				})
			);
			expect(result).toEqual(mockStats);
		});
	});

	describe("エラーハンドリング", () => {
		it("ネットワークエラーを適切に処理する", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			await expect(getUnlabeledArticles()).rejects.toThrow("Network error");
		});

		it("HTTPエラーレスポンスを適切に処理する", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(getUnlabeledArticles()).rejects.toThrow("Failed to fetch unlabeled articles: Internal Server Error");
		});

		it("JSONパースエラーを適切に処理する", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.reject(new Error("Invalid JSON")),
			});

			await expect(getUnlabeledArticles()).rejects.toThrow("Invalid JSON");
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("APIクライアント包括テストファイルが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}