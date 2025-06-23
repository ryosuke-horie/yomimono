import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
/**
 * 未評価記事取得MCPツールのテスト
 */
import { describe, expect, it, vi } from "vitest";
import type { BookmarkWithLabel } from "../lib/apiClient.js";
import * as apiClient from "../lib/apiClient.js";

// apiClientのモック
vi.mock("../lib/apiClient.js", () => ({
	getUnratedArticles: vi.fn(),
}));

// モックデータ
const mockUnratedArticles: BookmarkWithLabel[] = [
	{
		id: 1,
		url: "https://example.com/article1",
		title: "未評価の記事1",
		isRead: false,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		isFavorite: false,
		label: null,
	},
	{
		id: 2,
		url: "https://example.com/article2",
		title: "未評価の記事2",
		isRead: true,
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-02"),
		isFavorite: true,
		label: {
			id: 1,
			name: "JavaScript",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
			description: null,
		},
	},
];

describe("getUnratedArticles MCPツール", () => {
	it("未評価記事のリストを正常に取得する", async () => {
		// モックの設定
		vi.mocked(apiClient.getUnratedArticles).mockResolvedValue(
			mockUnratedArticles,
		);

		// server.toolの実際の実装をシミュレート
		const toolFunction = async () => {
			try {
				const articles = await apiClient.getUnratedArticles();
				return {
					content: [
						{
							type: "text",
							text: `未評価記事リスト:\n${JSON.stringify(articles, null, 2)}`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error("Error in getUnratedArticles tool:", errorMessage);
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
		};

		// ツールを実行
		const result = await toolFunction();

		// 結果の検証
		const parsed = CallToolResultSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		expect(result.isError).toBe(false);
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("未評価記事リスト:");
		expect(result.content[0].text).toContain("未評価の記事1");
		expect(result.content[0].text).toContain("未評価の記事2");
		expect(apiClient.getUnratedArticles).toHaveBeenCalledTimes(1);
	});

	it("空の配列を返す場合も正常に処理する", async () => {
		// モックの設定
		vi.mocked(apiClient.getUnratedArticles).mockResolvedValue([]);

		// server.toolの実際の実装をシミュレート
		const toolFunction = async () => {
			try {
				const articles = await apiClient.getUnratedArticles();
				return {
					content: [
						{
							type: "text",
							text: `未評価記事リスト:\n${JSON.stringify(articles, null, 2)}`,
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
							text: `未評価記事の取得に失敗しました: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		};

		// ツールを実行
		const result = await toolFunction();

		// 結果の検証
		expect(result.isError).toBe(false);
		expect(result.content[0].text).toContain("未評価記事リスト:");
		expect(result.content[0].text).toContain("[]");
	});

	it("APIエラーの場合、エラーメッセージを返す", async () => {
		// モックの設定
		const mockError = new Error("API connection failed");
		vi.mocked(apiClient.getUnratedArticles).mockRejectedValue(mockError);

		// server.toolの実際の実装をシミュレート
		const toolFunction = async () => {
			try {
				const articles = await apiClient.getUnratedArticles();
				return {
					content: [
						{
							type: "text",
							text: `未評価記事リスト:\n${JSON.stringify(articles, null, 2)}`,
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
							text: `未評価記事の取得に失敗しました: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		};

		// ツールを実行
		const result = await toolFunction();

		// 結果の検証
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toBe(
			"未評価記事の取得に失敗しました: API connection failed",
		);
	});
});
