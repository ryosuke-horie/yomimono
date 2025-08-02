/**
 * MCPサーバーのラベル関連機能の包括的なテスト
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockInstance } from "vitest";
import * as apiClient from "../lib/apiClient.js";

describe("Label API Functions", () => {
	let fetchMock: MockInstance;
	const originalEnv = process.env.API_BASE_URL;

	beforeEach(() => {
		// 環境変数をモック
		process.env.API_BASE_URL = "http://localhost:3000";
		// fetchをモック化
		fetchMock = vi.spyOn(global, "fetch");
	});

	afterEach(() => {
		// 環境変数を復元
		if (originalEnv) {
			process.env.API_BASE_URL = originalEnv;
		} else {
			delete process.env.API_BASE_URL;
		}
		// モックをリセット
		vi.restoreAllMocks();
	});

	describe("getLabels", () => {
		test("正常にラベル一覧を取得できること", async () => {
			const mockLabels = [
				{
					id: 1,
					name: "技術記事",
					description: "技術関連の記事",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					name: "ニュース",
					description: null,
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					labels: mockLabels,
				}),
			} as Response);

			const result = await apiClient.getLabels();

			expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/labels");
			expect(result).toEqual(mockLabels);
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Internal Server Error",
			} as Response);

			await expect(apiClient.getLabels()).rejects.toThrow(
				"Failed to fetch labels: Internal Server Error",
			);
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// success: trueが欠けている
					labels: [],
				}),
			} as Response);

			await expect(apiClient.getLabels()).rejects.toThrow(
				"Invalid API response for labels:",
			);
		});

		test("空のラベル配列を正常に処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					labels: [],
				}),
			} as Response);

			const result = await apiClient.getLabels();
			expect(result).toEqual([]);
		});
	});

	describe("getUnlabeledArticles", () => {
		test("正常に未ラベル記事を取得できること", async () => {
			const mockArticles = [
				{
					id: 1,
					title: "Test Article 1",
					url: "https://example.com/1",
					isRead: false,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					title: "Test Article 2",
					url: "https://example.com/2",
					isRead: true,
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockArticles,
				}),
			} as Response);

			const result = await apiClient.getUnlabeledArticles();

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/unlabeled",
			);
			expect(result).toEqual(
				mockArticles.map((article) => ({
					...article,
					label: null,
					isFavorite: false,
				})),
			);
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(apiClient.getUnlabeledArticles()).rejects.toThrow(
				"Failed to fetch unlabeled articles: Not Found",
			);
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					// bookmarksではなくarticlesというキー
					articles: [],
				}),
			} as Response);

			await expect(apiClient.getUnlabeledArticles()).rejects.toThrow(
				"Invalid API response for unlabeled articles",
			);
		});
	});

	describe("assignLabel", () => {
		test("正常にラベルを記事に割り当てできること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			await apiClient.assignLabelToArticle(1, "技術記事", "技術関連の記事");

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/1/label",
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						labelName: "技術記事",
						description: "技術関連の記事",
					}),
				},
			);
		});

		test("説明なしでラベルを割り当てできること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			await apiClient.assignLabelToArticle(1, "技術記事");

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/1/label",
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						labelName: "技術記事",
						description: undefined,
					}),
				},
			);
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
			} as Response);

			await expect(
				apiClient.assignLabelToArticle(1, "技術記事"),
			).rejects.toThrow(
				'Failed to assign label "技術記事" to article 1: Bad Request',
			);
		});
	});

	describe("assignLabelsToMultipleArticles", () => {
		test("正常に複数記事にラベルを割り当てできること", async () => {
			const mockResponse = {
				success: true,
				successful: 3,
				skipped: 1,
				errors: [],
				label: {
					id: 1,
					name: "技術記事",
					description: "技術関連の記事",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles(
				[1, 2, 3, 4],
				"技術記事",
				"技術関連の記事",
			);

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/batch-label",
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						articleIds: [1, 2, 3, 4],
						labelName: "技術記事",
						description: "技術関連の記事",
					}),
				},
			);

			expect(result).toEqual({
				successful: 3,
				skipped: 1,
				errors: [],
				label: mockResponse.label,
			});
		});

		test("エラーが含まれるレスポンスを正しく処理できること", async () => {
			const mockResponse = {
				success: true,
				successful: 2,
				skipped: 0,
				errors: [
					{ articleId: 3, error: "Article not found" },
					{ articleId: 4, error: "Database error" },
				],
				label: {
					id: 1,
					name: "技術記事",
					description: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles(
				[1, 2, 3, 4],
				"技術記事",
			);

			expect(result.errors).toHaveLength(2);
			expect(result.errors[0]).toEqual({
				articleId: 3,
				error: "Article not found",
			});
		});

		test("空の記事ID配列でも正常に処理できること", async () => {
			const mockResponse = {
				success: true,
				successful: 0,
				skipped: 0,
				errors: [],
				label: {
					id: 1,
					name: "技術記事",
					description: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles(
				[],
				"技術記事",
			);

			expect(result.successful).toBe(0);
			expect(result.skipped).toBe(0);
			expect(result.errors).toEqual([]);
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
				json: async () => ({
					message: "Invalid label name",
				}),
			} as Response);

			await expect(
				apiClient.assignLabelsToMultipleArticles([1, 2], ""),
			).rejects.toThrow("Invalid label name: Bad Request");
		});

		test("JSONパースエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as unknown as Response);

			await expect(
				apiClient.assignLabelsToMultipleArticles([1], "test"),
			).rejects.toThrow(
				"Failed to parse response for batch label assignment: Invalid JSON",
			);
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// success: trueが欠けている
					successful: 1,
					skipped: 0,
					errors: [],
				}),
			} as Response);

			await expect(
				apiClient.assignLabelsToMultipleArticles([1], "test"),
			).rejects.toThrow("Invalid API response for batch label assignment:");
		});

		test("null/undefined レスポンスを適切に処理すること", async () => {
			// nullレスポンスのテスト
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => null,
			} as Response);

			await expect(
				apiClient.assignLabelsToMultipleArticles([1], "test"),
			).rejects.toThrow("Invalid API response for batch label assignment:");

			// undefinedレスポンスのテスト
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => undefined,
			} as Response);

			await expect(
				apiClient.assignLabelsToMultipleArticles([1], "test"),
			).rejects.toThrow("Invalid API response for batch label assignment:");
		});
	});

	describe("createLabel", () => {
		test("正常に新しいラベルを作成できること", async () => {
			const mockLabel = {
				id: 1,
				name: "新規ラベル",
				description: "新しいラベルの説明",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as Response);

			const result = await apiClient.createLabel("新規ラベル", "新しいラベルの説明");

			expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/labels", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "新規ラベル",
					description: "新しいラベルの説明",
				}),
			});

			expect(result).toEqual(mockLabel);
		});

		test("説明なしでラベルを作成できること", async () => {
			const mockLabel = {
				id: 1,
				name: "新規ラベル",
				description: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as Response);

			const result = await apiClient.createLabel("新規ラベル");

			expect(result.description).toBeNull();
		});

		test("重複するラベル名でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 409,
				statusText: "Conflict",
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					message: "Label already exists",
				}),
			} as Response);

			await expect(apiClient.createLabel("既存ラベル")).rejects.toThrow(
				"Label already exists: Conflict (Status: 409)",
			);
		});

		test("JSONパースエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: "Bad Request",
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as unknown as Response);

			await expect(apiClient.createLabel("test")).rejects.toThrow(
				'Failed to create label "test". Status: 400 Bad Request',
			);
		});
	});

	describe("getLabelById", () => {
		test("正常に特定のラベルを取得できること", async () => {
			const mockLabel = {
				id: 1,
				name: "技術記事",
				description: "技術関連の記事",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as Response);

			const result = await apiClient.getLabelById(1);

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/labels/1",
			);
			expect(result).toEqual(mockLabel);
		});

		test("存在しないIDでエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(apiClient.getLabelById(999)).rejects.toThrow(
				"Failed to fetch label with ID 999: Not Found",
			);
		});

		test("JSONパースエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as unknown as Response);

			await expect(apiClient.getLabelById(1)).rejects.toThrow(
				"Failed to parse response when fetching label 1: Invalid JSON",
			);
		});
	});

	describe("updateLabelDescription", () => {
		test("正常にラベルの説明を更新できること", async () => {
			const mockLabel = {
				id: 1,
				name: "技術記事",
				description: "更新された説明",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as Response);

			const result = await apiClient.updateLabelDescription(1, "更新された説明");

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/labels/1",
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ description: "更新された説明" }),
				},
			);

			expect(result).toEqual(mockLabel);
		});

		test("説明をnullに設定できること", async () => {
			const mockLabel = {
				id: 1,
				name: "技術記事",
				description: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					label: mockLabel,
				}),
			} as Response);

			const result = await apiClient.updateLabelDescription(1, null);

			expect(result.description).toBeNull();
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(
				apiClient.updateLabelDescription(999, "新しい説明"),
			).rejects.toThrow(
				"Failed to update description for label 999: Not Found",
			);
		});
	});

	describe("deleteLabel", () => {
		test("正常にラベルを削除できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "Label deleted successfully",
				}),
			} as Response);

			await expect(apiClient.deleteLabel(1)).resolves.toBeUndefined();

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/labels/1",
				{
					method: "DELETE",
				},
			);
		});

		test("存在しないラベルの削除でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: async () => ({
					message: "Label not found",
				}),
			} as Response);

			await expect(apiClient.deleteLabel(999)).rejects.toThrow(
				"Label not found: Not Found (Status: 404)",
			);
		});

		test("使用中のラベルの削除でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 409,
				statusText: "Conflict",
				json: async () => ({
					message: "Cannot delete label: still in use",
				}),
			} as Response);

			await expect(apiClient.deleteLabel(1)).rejects.toThrow(
				"Cannot delete label: still in use: Conflict (Status: 409)",
			);
		});
	});

	describe("Environment Variable Handling", () => {
		test("API_BASE_URLが設定されていない場合エラーをスローすること", async () => {
			delete process.env.API_BASE_URL;

			await expect(apiClient.getLabels()).rejects.toThrow(
				"API_BASE_URL environment variable is not set",
			);
		});

		test("API_BASE_URLが正しく使用されること", async () => {
			process.env.API_BASE_URL = "https://api.example.com";

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					labels: [],
				}),
			} as Response);

			await apiClient.getLabels();

			expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/api/labels");
		});
	});

	describe("Input Validation", () => {
		test("記事IDに負の値を指定した場合でもAPIリクエストは送信されること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
			} as Response);

			await expect(apiClient.assignLabelToArticle(-1, "test")).rejects.toThrow(
				'Failed to assign label "test" to article -1: Bad Request',
			);

			expect(fetchMock).toHaveBeenCalled();
		});

		test("空のラベル名でもAPIリクエストは送信されること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
			} as Response);

			await expect(apiClient.assignLabelToArticle(1, "")).rejects.toThrow(
				'Failed to assign label "" to article 1: Bad Request',
			);

			expect(fetchMock).toHaveBeenCalled();
		});

		test("特殊文字を含むラベル名が適切にエンコードされること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			const specialLabelName = "テスト/ラベル#1 & 特殊文字";
			await apiClient.assignLabelToArticle(1, specialLabelName, "説明");

			const callArgs = fetchMock.mock.calls[0];
			const body = JSON.parse(callArgs[1].body as string);
			expect(body.labelName).toBe(specialLabelName);
		});
	});
});

describe("Error Recovery and Retry Logic", () => {
	let fetchMock: MockInstance;

	beforeEach(() => {
		process.env.API_BASE_URL = "http://localhost:3000";
		fetchMock = vi.spyOn(global, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("ネットワークエラー時に適切なエラーメッセージを返すこと", async () => {
		fetchMock.mockRejectedValueOnce(new Error("Network error"));

		await expect(apiClient.getLabels()).rejects.toThrow("Network error");
	});

	test("タイムアウトエラーを適切に処理すること", async () => {
		fetchMock.mockRejectedValueOnce(new Error("Request timeout"));

		await expect(apiClient.getUnlabeledArticles()).rejects.toThrow(
			"Request timeout",
		);
	});
});