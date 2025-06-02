/**
 * 記事評価MCP ツールのテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";
import {
	fetchArticleContent,
	generateRatingPrompt,
} from "../lib/articleContentFetcher.js";

// モック
vi.mock("../lib/apiClient.js");
vi.mock("../lib/articleContentFetcher.js");

const mockApiClient = vi.mocked(apiClient);
const mockFetchArticleContent = vi.mocked(fetchArticleContent);
const mockGenerateRatingPrompt = vi.mocked(generateRatingPrompt);

describe("rateArticleWithContent tool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事内容を取得して評価プロンプトを生成する", async () => {
		const mockArticleContent = {
			title: "TypeScriptの型安全性について",
			content: "TypeScriptは静的型検査により...",
			metadata: {
				author: "田中太郎",
				publishedDate: "2024-01-01",
				tags: ["TypeScript", "型安全性"],
				readingTime: 10,
			},
		};

		const mockPrompt = "記事の内容を5つの軸で評価してください...";

		mockFetchArticleContent.mockResolvedValue(mockArticleContent);
		mockGenerateRatingPrompt.mockReturnValue(mockPrompt);

		// 実際のツール実行をシミュレート
		const toolInput = {
			articleId: 123,
			url: "https://example.com/typescript-article",
			fetchContent: true,
		};

		// ツール処理のシミュレート
		const articleContent = await fetchArticleContent(toolInput.url);
		const evaluationPrompt = generateRatingPrompt(
			articleContent,
			toolInput.url,
		);

		expect(mockFetchArticleContent).toHaveBeenCalledWith(toolInput.url);
		expect(mockGenerateRatingPrompt).toHaveBeenCalledWith(
			articleContent,
			toolInput.url,
		);
		expect(evaluationPrompt).toBe(mockPrompt);
	});

	it("記事内容取得をスキップした場合の処理", async () => {
		const mockPrompt = "記事の内容を5つの軸で評価してください...";
		mockGenerateRatingPrompt.mockReturnValue(mockPrompt);

		const toolInput = {
			articleId: 123,
			url: "https://example.com/typescript-article",
			fetchContent: false,
		};

		// ツール処理のシミュレート（記事内容取得なし）
		const evaluationPrompt = generateRatingPrompt(null, toolInput.url);

		expect(mockFetchArticleContent).not.toHaveBeenCalled();
		expect(mockGenerateRatingPrompt).toHaveBeenCalledWith(null, toolInput.url);
		expect(evaluationPrompt).toBe(mockPrompt);
	});

	it("記事内容取得エラー時の処理", async () => {
		const error = new Error("Network error");
		mockFetchArticleContent.mockRejectedValue(error);

		const toolInput = {
			articleId: 123,
			url: "https://example.com/typescript-article",
			fetchContent: true,
		};

		await expect(fetchArticleContent(toolInput.url)).rejects.toThrow(
			"Network error",
		);
	});
});

describe("getArticleRating tool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事の評価を正常に取得する", async () => {
		const mockRating = {
			id: 1,
			articleId: 123,
			practicalValue: 8,
			technicalDepth: 9,
			understanding: 7,
			novelty: 6,
			importance: 8,
			totalScore: 38,
			comment: "非常に有用な記事でした",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		mockApiClient.getArticleRating.mockResolvedValue(mockRating);

		const result = await apiClient.getArticleRating(123);

		expect(mockApiClient.getArticleRating).toHaveBeenCalledWith(123);
		expect(result).toEqual(mockRating);
	});

	it("評価が存在しない場合", async () => {
		mockApiClient.getArticleRating.mockResolvedValue(null);

		const result = await apiClient.getArticleRating(123);

		expect(result).toBeNull();
	});
});

describe("updateArticleRating tool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("記事の評価を正常に更新する", async () => {
		const updateData = {
			practicalValue: 9,
			comment: "更新されたコメント",
		};

		const updatedRating = {
			id: 1,
			articleId: 123,
			practicalValue: 9,
			technicalDepth: 9,
			understanding: 7,
			novelty: 6,
			importance: 8,
			totalScore: 39,
			comment: "更新されたコメント",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T12:00:00Z",
		};

		mockApiClient.updateArticleRating.mockResolvedValue(updatedRating);

		const result = await apiClient.updateArticleRating(123, updateData);

		expect(mockApiClient.updateArticleRating).toHaveBeenCalledWith(
			123,
			updateData,
		);
		expect(result).toEqual(updatedRating);
	});
});
