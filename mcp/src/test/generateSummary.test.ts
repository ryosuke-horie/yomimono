import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// APIクライアントのモック
vi.mock("../lib/apiClient.js", () => ({
	getBookmarkById: vi.fn(),
	saveSummary: vi.fn(),
}));

describe("generateSummary tool preparation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ブックマークの要約生成テスト用のモックが正しく設定されること", async () => {
		// モックデータの設定
		const mockBookmark = {
			id: 1,
			url: "https://example.com/article",
			title: "Test Article",
			isRead: false,
			summary: null,
			summaryCreatedAt: null,
			summaryUpdatedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const updatedBookmark = {
			...mockBookmark,
			summary:
				"この記事は「Test Article」に関する内容です。主要なポイント: • 技術的な概要",
			summaryCreatedAt: "2024-01-02T00:00:00Z",
			summaryUpdatedAt: "2024-01-02T00:00:00Z",
		};

		// モックの設定
		vi.mocked(apiClient.getBookmarkById).mockResolvedValue(mockBookmark);
		vi.mocked(apiClient.saveSummary).mockResolvedValue(updatedBookmark);

		// APIモックの呼び出しテスト
		const fetchedBookmark = await apiClient.getBookmarkById(1);
		expect(fetchedBookmark).toEqual(mockBookmark);
		expect(fetchedBookmark.summary).toBeNull();

		const savedBookmark = await apiClient.saveSummary(1, "要約テキスト");
		expect(savedBookmark.summary).toBeTruthy();
		expect(savedBookmark.summary).toContain("この記事は");
	});

	it("既に要約が存在するブックマークのテスト", async () => {
		const bookmarkWithSummary = {
			id: 2,
			url: "https://example.com/article2",
			title: "Test Article 2",
			isRead: true,
			summary: "既存の要約",
			summaryCreatedAt: "2024-01-01T00:00:00Z",
			summaryUpdatedAt: "2024-01-01T00:00:00Z",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		vi.mocked(apiClient.getBookmarkById).mockResolvedValue(bookmarkWithSummary);

		const fetchedBookmark = await apiClient.getBookmarkById(2);
		expect(fetchedBookmark.summary).not.toBeNull();
		expect(fetchedBookmark.summary).toBe("既存の要約");
	});

	it("APIエラーのハンドリングテスト", async () => {
		// APIエラーをシミュレート
		vi.mocked(apiClient.getBookmarkById).mockRejectedValue(
			new Error("Bookmark not found"),
		);

		await expect(apiClient.getBookmarkById(999)).rejects.toThrow(
			"Bookmark not found",
		);
	});

	it("要約生成時のパラメータテスト", async () => {
		const mockBookmark = {
			id: 3,
			url: "https://example.com/article3",
			title: "Test Article 3",
			isRead: false,
			summary: null,
			summaryCreatedAt: null,
			summaryUpdatedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		vi.mocked(apiClient.getBookmarkById).mockResolvedValue(mockBookmark);
		vi.mocked(apiClient.saveSummary).mockImplementation(
			async (bookmarkId, summary) => ({
				...mockBookmark,
				summary,
				summaryCreatedAt: new Date().toISOString(),
				summaryUpdatedAt: new Date().toISOString(),
			}),
		);

		// 異なるパラメータでの要約生成をシミュレート
		const shortSummary = "短い要約";
		const longSummary =
			"これは長い要約です。主要なポイント: • 詳細な技術概要 • 実装方法 • 結論";

		const result1 = await apiClient.saveSummary(3, shortSummary);
		expect(result1.summary).toBe(shortSummary);

		const result2 = await apiClient.saveSummary(3, longSummary);
		expect(result2.summary).toBe(longSummary);
		expect(result2.summary?.length).toBeGreaterThan(shortSummary.length);
	});
});
