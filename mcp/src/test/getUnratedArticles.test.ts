/**
 * getUnratedArticles MCP tool のテスト
 * 未評価記事取得ツールの動作をテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// APIクライアントをモック
vi.mock("../lib/apiClient.js");

const mockApiClient = vi.mocked(apiClient);

// MCPツールのハンドラ関数を模擬
async function getUnratedArticlesHandler() {
	try {
		const articles = await apiClient.getUnratedArticles();
		const articleCount = articles.length;

		return {
			content: [
				{
					type: "text",
					text: `未評価記事を${articleCount}件取得しました：\n\n${articles
						.map(
							(article, index) =>
								`${index + 1}. **${article.title || "タイトルなし"}**\n   URL: ${article.url}\n   読了: ${article.isRead ? "済" : "未読"}\n   お気に入り: ${article.isFavorite ? "★" : "☆"}\n   ラベル: ${article.label?.name || "なし"}\n`,
						)
						.join("\n")}`,
				},
			],
			isError: false,
		};
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			content: [
				{
					type: "text",
					text: `未評価記事の取得に失敗しました: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

describe("getUnratedArticles MCP tool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("未評価記事を正常に取得して返す", async () => {
		// モックデータの準備
		const mockUnratedArticles = [
			{
				id: 1,
				url: "https://example.com/unrated-1",
				title: "未評価記事1",
				isRead: false,
				isFavorite: false,
				label: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			{
				id: 2,
				url: "https://example.com/unrated-2",
				title: "未評価記事2",
				isRead: true,
				isFavorite: true,
				label: {
					id: 1,
					name: "TypeScript",
					description: "TypeScript関連記事",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				createdAt: "2024-01-02T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
			},
		];

		// apiClient.getUnratedArticlesのモック
		mockApiClient.getUnratedArticles.mockResolvedValue(mockUnratedArticles);

		// ツールの実行
		const result = await getUnratedArticlesHandler();

		// 検証
		expect(apiClient.getUnratedArticles).toHaveBeenCalledOnce();
		expect(result.isError).toBe(false);
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("未評価記事を2件取得しました");
		expect(result.content[0].text).toContain("未評価記事1");
		expect(result.content[0].text).toContain("未評価記事2");
		expect(result.content[0].text).toContain("TypeScript");
		expect(result.content[0].text).toContain("https://example.com/unrated-1");
		expect(result.content[0].text).toContain("https://example.com/unrated-2");
	});

	test("未評価記事が存在しない場合は空配列を返す", async () => {
		// 空配列のモック
		mockApiClient.getUnratedArticles.mockResolvedValue([]);

		// ツールの実行
		const result = await getUnratedArticlesHandler();

		// 検証
		expect(apiClient.getUnratedArticles).toHaveBeenCalledOnce();
		expect(result.isError).toBe(false);
		expect(result.content).toHaveLength(1);
		expect(result.content[0].text).toContain("未評価記事を0件取得しました");
	});

	test("APIクライアントでエラーが発生した場合はエラーレスポンスを返す", async () => {
		// エラーのモック
		const mockError = new Error("API connection failed");
		mockApiClient.getUnratedArticles.mockRejectedValue(mockError);

		// ツールの実行
		const result = await getUnratedArticlesHandler();

		// 検証
		expect(apiClient.getUnratedArticles).toHaveBeenCalledOnce();
		expect(result.isError).toBe(true);
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("未評価記事の取得に失敗しました");
		expect(result.content[0].text).toContain("API connection failed");
	});

	test("APIクライアントで文字列エラーが発生した場合も適切にハンドルする", async () => {
		// 文字列エラーのモック
		mockApiClient.getUnratedArticles.mockRejectedValue("Network error");

		// ツールの実行
		const result = await getUnratedArticlesHandler();

		// 検証
		expect(apiClient.getUnratedArticles).toHaveBeenCalledOnce();
		expect(result.isError).toBe(true);
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("未評価記事の取得に失敗しました");
		expect(result.content[0].text).toContain("Network error");
	});
});
