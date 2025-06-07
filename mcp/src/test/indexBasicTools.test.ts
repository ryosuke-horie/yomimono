/**
 * MCPサーバーの基本ツールのテスト
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// apiClientモジュール全体をモック
vi.mock("../lib/apiClient.js");

describe("MCP Server Basic Tools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://test-api.example.com";
	});

	describe("getUnlabeledArticles tool logic", () => {
		test("正常な未ラベル記事の取得", async () => {
			const mockArticles = [
				{
					id: 1,
					title: "Test Article 1",
					url: "https://example.com/1",
					isRead: false,
					isFavorite: false,
					label: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 2,
					title: "Test Article 2",
					url: "https://example.com/2",
					isRead: true,
					isFavorite: false,
					label: null,
					createdAt: "2024-01-02T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
				},
			];

			vi.mocked(apiClient.getUnlabeledArticles).mockResolvedValue(mockArticles);

			const result = await apiClient.getUnlabeledArticles();

			expect(result).toEqual(mockArticles);
			expect(apiClient.getUnlabeledArticles).toHaveBeenCalledOnce();
		});

		test("API エラー時のエラーハンドリング", async () => {
			const errorMessage = "API接続エラー";

			vi.mocked(apiClient.getUnlabeledArticles).mockRejectedValue(
				new Error(errorMessage),
			);

			await expect(apiClient.getUnlabeledArticles()).rejects.toThrow(
				errorMessage,
			);
		});
	});

	describe("getLabels tool logic", () => {
		test("正常なラベル一覧の取得", async () => {
			const mockLabels = [
				{ id: 1, name: "技術", description: "技術記事" },
				{ id: 2, name: "ビジネス", description: "ビジネス記事" },
			];

			vi.mocked(apiClient.getLabels).mockResolvedValue(mockLabels);

			const result = await apiClient.getLabels();

			expect(result).toEqual(mockLabels);
			expect(apiClient.getLabels).toHaveBeenCalledOnce();
		});

		test("空のラベル一覧の取得", async () => {
			vi.mocked(apiClient.getLabels).mockResolvedValue([]);

			const result = await apiClient.getLabels();

			expect(result).toEqual([]);
			expect(apiClient.getLabels).toHaveBeenCalledOnce();
		});
	});

	describe("assignLabel tool logic", () => {
		test("正常なラベル割り当て", async () => {
			const articleId = 123;
			const labelName = "技術";
			const description = "技術関連の記事";

			vi.mocked(apiClient.assignLabelToArticle).mockResolvedValue(undefined);

			await apiClient.assignLabelToArticle(articleId, labelName, description);

			expect(apiClient.assignLabelToArticle).toHaveBeenCalledWith(
				articleId,
				labelName,
				description,
			);
			expect(apiClient.assignLabelToArticle).toHaveBeenCalledOnce();
		});

		test("説明なしでのラベル割り当て", async () => {
			const articleId = 456;
			const labelName = "ビジネス";

			vi.mocked(apiClient.assignLabelToArticle).mockResolvedValue(undefined);

			await apiClient.assignLabelToArticle(articleId, labelName);

			expect(apiClient.assignLabelToArticle).toHaveBeenCalledWith(
				articleId,
				labelName,
			);
			expect(apiClient.assignLabelToArticle).toHaveBeenCalledOnce();
		});
	});

	describe("createLabel tool logic", () => {
		test("正常な新規ラベル作成", async () => {
			const labelName = "新しいラベル";
			const description = "新しいラベルの説明";
			const mockCreatedLabel = {
				id: 10,
				name: labelName,
				description: description,
				createdAt: "2024-01-01T00:00:00Z",
			};

			vi.mocked(apiClient.createLabel).mockResolvedValue(mockCreatedLabel);

			const result = await apiClient.createLabel(labelName, description);

			expect(result).toEqual(mockCreatedLabel);
			expect(apiClient.createLabel).toHaveBeenCalledWith(
				labelName,
				description,
			);
			expect(apiClient.createLabel).toHaveBeenCalledOnce();
		});

		test("説明なしでの新規ラベル作成", async () => {
			const labelName = "シンプルラベル";
			const mockCreatedLabel = {
				id: 11,
				name: labelName,
				description: null,
				createdAt: "2024-01-01T00:00:00Z",
			};

			vi.mocked(apiClient.createLabel).mockResolvedValue(mockCreatedLabel);

			const result = await apiClient.createLabel(labelName);

			expect(result).toEqual(mockCreatedLabel);
			expect(apiClient.createLabel).toHaveBeenCalledWith(labelName);
			expect(apiClient.createLabel).toHaveBeenCalledOnce();
		});
	});

	describe("assignLabelsToMultipleArticles tool logic", () => {
		test("複数記事への一括ラベル割り当て", async () => {
			const articleIds = [1, 2, 3];
			const labelName = "バッチ処理";
			const description = "一括処理されたラベル";
			const mockResult = {
				successful: 3,
				skipped: 0,
				errors: [],
				label: { id: 5, name: labelName, description: description },
			};

			vi.mocked(apiClient.assignLabelsToMultipleArticles).mockResolvedValue(
				mockResult,
			);

			const result = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				labelName,
				description,
			);

			expect(result).toEqual(mockResult);
			expect(apiClient.assignLabelsToMultipleArticles).toHaveBeenCalledWith(
				articleIds,
				labelName,
				description,
			);
			expect(apiClient.assignLabelsToMultipleArticles).toHaveBeenCalledOnce();
		});

		test("一部失敗のある一括ラベル割り当て", async () => {
			const articleIds = [1, 2, 999];
			const labelName = "部分的成功";
			const mockResult = {
				successful: 2,
				skipped: 0,
				errors: [{ articleId: 999, error: "記事が見つかりません" }],
				label: { id: 6, name: labelName, description: null },
			};

			vi.mocked(apiClient.assignLabelsToMultipleArticles).mockResolvedValue(
				mockResult,
			);

			const result = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				labelName,
			);

			expect(result).toEqual(mockResult);
			expect(result.successful).toBe(2);
			expect(result.errors).toHaveLength(1);
		});
	});
});
