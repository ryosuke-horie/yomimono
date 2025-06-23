/**
 * APIクライアントコア機能のテスト - カバレッジ10%到達のための追加テスト
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	assignLabelsToMultipleArticles,
	assignLabelToArticle,
	type CreateRatingData,
	createArticleRating,
	createLabel,
	deleteLabel,
	getArticleRating,
	getBookmarkById,
	getLabelById,
	getReadBookmarks,
	getUnreadBookmarks,
	markBookmarkAsRead,
	type UpdateRatingData,
	updateArticleRating,
	updateLabelDescription,
} from "../lib/apiClient.js";

// fetchをモック
global.fetch = vi.fn();

describe("API Client Core Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("assignLabelToArticle", () => {
		test("正常なラベル割り当て", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
			} as unknown as Response);

			await expect(
				assignLabelToArticle(123, "技術", "技術記事"),
			).resolves.not.toThrow();
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/123/label",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ labelName: "技術", description: "技術記事" }),
				},
			);
		});

		test("APIエラー時のエラーハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Bad Request",
			} as unknown as Response);

			await expect(assignLabelToArticle(123, "技術")).rejects.toThrow(
				'Failed to assign label "技術" to article 123: Bad Request',
			);
		});
	});

	describe("createLabel", () => {
		test("正常なラベル作成", async () => {
			const mockLabel = {
				id: 1,
				name: "新ラベル",
				description: "説明",
				createdAt: "2024-01-01T00:00:00Z",
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				headers: { get: () => "application/json" },
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as unknown as Response);

			const result = await createLabel("新ラベル", "説明");
			expect(result).toEqual(mockLabel);
		});

		test("APIエラーでのJSONパース失敗", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 400,
				statusText: "Bad Request",
				json: async () => {
					throw new Error("JSON parse error");
				},
			} as unknown as Response);

			await expect(createLabel("無効ラベル")).rejects.toThrow(
				'Failed to create label "無効ラベル". Status: 400 Bad Request',
			);
		});
	});

	describe("getLabelById", () => {
		test("正常なラベル取得", async () => {
			const mockLabel = {
				id: 1,
				name: "取得ラベル",
				description: "取得テスト",
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as unknown as Response);

			const result = await getLabelById(1);
			expect(result).toEqual(mockLabel);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/labels/1",
			);
		});

		test("ラベル取得時のJSONパースエラー", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Parse failed");
				},
			} as unknown as Response);

			await expect(getLabelById(1)).rejects.toThrow(
				"Failed to parse response when fetching label 1: Parse failed",
			);
		});
	});

	describe("updateLabelDescription", () => {
		test("正常な説明更新", async () => {
			const updatedLabel = {
				id: 1,
				name: "ラベル",
				description: "新しい説明",
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					label: updatedLabel,
				}),
			} as unknown as Response);

			const result = await updateLabelDescription(1, "新しい説明");
			expect(result).toEqual(updatedLabel);
		});

		test("説明をnullで更新", async () => {
			const updatedLabel = {
				id: 1,
				name: "ラベル",
				description: null,
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					label: updatedLabel,
				}),
			} as unknown as Response);

			const result = await updateLabelDescription(1, null);
			expect(result).toEqual(updatedLabel);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/labels/1",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: null }),
				},
			);
		});
	});

	describe("deleteLabel", () => {
		test("正常なラベル削除", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					message: "削除完了",
				}),
			} as unknown as Response);

			await expect(deleteLabel(1)).resolves.not.toThrow();
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/labels/1",
				{ method: "DELETE" },
			);
		});

		test("削除失敗時のエラーメッセージ解析", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: async () => ({
					message: "ラベルが見つかりません",
				}),
			} as unknown as Response);

			await expect(deleteLabel(999)).rejects.toThrow(
				"ラベルが見つかりません: Not Found (Status: 404)",
			);
		});
	});

	describe("getBookmarkById", () => {
		test("正常なブックマーク取得", async () => {
			const mockBookmark = {
				id: 1,
				url: "https://example.com",
				title: "テスト記事",
				isRead: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					bookmark: mockBookmark,
				}),
			} as unknown as Response);

			const result = await getBookmarkById(1);
			expect(result).toEqual(mockBookmark);
		});
	});

	describe("getUnreadBookmarks", () => {
		test("正常な未読ブックマーク取得", async () => {
			// APIレスポンスはArticleSchemaの形式
			const mockApiResponse = [
				{
					id: 1,
					url: "https://example.com",
					title: "未読記事",
					label: {
						id: 10,
						name: "技術",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
					isRead: false,
					isFavorite: false,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			// 期待される返却値（BookmarkWithReadStatusSchemaの形式）
			const expectedResult = [
				{
					id: 1,
					url: "https://example.com",
					title: "未読記事",
					labels: ["技術"],
					isRead: false,
					isFavorite: false,
					createdAt: "2024-01-01T00:00:00Z",
					readAt: null,
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockApiResponse,
				}),
			} as unknown as Response);

			const result = await getUnreadBookmarks();
			expect(result).toEqual(expectedResult);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks",
			);
		});
	});

	describe("getReadBookmarks", () => {
		test("正常な既読ブックマーク取得", async () => {
			const mockBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "既読記事",
					labels: ["技術"],
					isRead: true,
					isFavorite: false,
					createdAt: "2024-01-01T00:00:00Z",
					readAt: "2024-01-02T00:00:00Z",
				},
			];

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as unknown as Response);

			const result = await getReadBookmarks();
			expect(result).toEqual(mockBookmarks);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/read",
			);
		});
	});

	describe("markBookmarkAsRead", () => {
		test("正常な既読マーク", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					message: "既読にマークしました",
				}),
			} as unknown as Response);

			const result = await markBookmarkAsRead(123);
			expect(result).toEqual({
				success: true,
				message: "既読にマークしました",
			});
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/123/read",
				{ method: "PATCH" },
			);
		});
	});

	describe("createArticleRating", () => {
		test("JSONパースエラーのハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as unknown as Response);

			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			await expect(createArticleRating(123, ratingData)).rejects.toThrow(
				"Failed to parse response when creating rating for article 123: Invalid JSON",
			);
		});
	});

	describe("getArticleRating", () => {
		test("JSONパースエラーのハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Parse error");
				},
			} as unknown as Response);

			await expect(getArticleRating(123)).rejects.toThrow(
				"Failed to parse response when getting rating for article 123: Parse error",
			);
		});
	});

	describe("updateArticleRating", () => {
		test("JSONパースエラーのハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Update parse error");
				},
			} as unknown as Response);

			const updateData: UpdateRatingData = {
				practicalValue: 9,
			};

			await expect(updateArticleRating(123, updateData)).rejects.toThrow(
				"Failed to parse response when updating rating for article 123: Update parse error",
			);
		});
	});

	describe("assignLabelsToMultipleArticles", () => {
		test("JSONパースエラーのハンドリング", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error("Batch parse error");
				},
			} as unknown as Response);

			await expect(
				assignLabelsToMultipleArticles([1, 2, 3], "バッチ"),
			).rejects.toThrow(
				"Failed to parse response for batch label assignment: Batch parse error",
			);
		});

		test("APIエラー時のエラーメッセージ解析", async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				statusText: "Internal Server Error",
				json: async () => ({
					message: "バッチ処理に失敗しました",
				}),
			} as unknown as Response);

			await expect(
				assignLabelsToMultipleArticles([1, 2], "失敗"),
			).rejects.toThrow("バッチ処理に失敗しました: Internal Server Error");
		});
	});
});
