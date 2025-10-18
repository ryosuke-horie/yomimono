/**
 * MCPサーバーの基本テスト
 */
import { describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

describe("MCP Server Basic Tests", () => {
	test("apiClient should export required functions", () => {
		expect(typeof apiClient.getUnlabeledArticles).toBe("function");
		expect(typeof apiClient.getLabels).toBe("function");
		expect(typeof apiClient.assignLabelToArticle).toBe("function");
		expect(typeof apiClient.createLabel).toBe("function");
		expect(typeof apiClient.getLabelById).toBe("function");
		expect(typeof apiClient.deleteLabel).toBe("function");
		expect(typeof apiClient.updateLabelDescription).toBe("function");
		expect(typeof apiClient.assignLabelsToMultipleArticles).toBe("function");
		expect(typeof apiClient.getBookmarkById).toBe("function");
		expect(typeof apiClient.getUnreadArticlesByLabel).toBe("function");
		expect(typeof apiClient.getUnreadBookmarks).toBe("function");
		expect(typeof apiClient.getReadBookmarks).toBe("function");
		expect(typeof apiClient.markBookmarkAsRead).toBe("function");
	});
});

describe("assignLabelsToMultipleArticles", () => {
	test("正常なレスポンスを処理できること", async () => {
		// fetchをモック化
		const mockResponse = {
			ok: true,
			json: async () => ({
				success: true,
				successful: 2,
				skipped: 1,
				errors: [],
				label: {
					id: 1,
					name: "テストラベル",
					description: "テスト用の説明",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			}),
		};

		global.fetch = vi.fn().mockResolvedValue(mockResponse);
		process.env.API_BASE_URL = "http://localhost:3000";

		const result = await apiClient.assignLabelsToMultipleArticles([1, 2, 3], "テストラベル", "テスト用の説明");

		expect(result).toEqual({
			successful: 2,
			skipped: 1,
			errors: [],
			label: {
				id: 1,
				name: "テストラベル",
				description: "テスト用の説明",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		});
	});

	test("エラーレスポンスを適切に処理できること", async () => {
		// fetchをモック化してエラーレスポンスを返す
		const mockResponse = {
			ok: false,
			statusText: "Bad Request",
			json: async () => ({
				message: "Invalid request",
			}),
		};

		global.fetch = vi.fn().mockResolvedValue(mockResponse);
		process.env.API_BASE_URL = "http://localhost:3000";

		await expect(apiClient.assignLabelsToMultipleArticles([1], "テストラベル")).rejects.toThrow(
			"Invalid request: Bad Request",
		);
	});
});
