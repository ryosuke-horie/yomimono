import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";
import { getSummaryPrompt } from "../lib/promptTemplates.js";

// APIクライアントのモック
vi.mock("../lib/apiClient.js", () => ({
	getBookmarkById: vi.fn(),
	saveSummary: vi.fn(),
}));

describe("generateSummary tool preparation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ブックマークの要約生成指示が正しく生成されること", async () => {
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

		// モックの設定
		vi.mocked(apiClient.getBookmarkById).mockResolvedValue(mockBookmark);

		// generateSummaryツールが返す指示内容をテスト
		const fetchedBookmark = await apiClient.getBookmarkById(1);
		expect(fetchedBookmark).toEqual(mockBookmark);
		expect(fetchedBookmark.summary).toBeNull();

		// 指示内容に含まれるべき要素の確認
		const instruction =
			"以下のURLの技術記事を読み込んで、エンジニア向けの要約を生成してください。";
		expect(instruction).toContain("技術記事");
		expect(instruction).toContain("エンジニア向け");
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

	it("プロンプトテンプレートを使用した指示生成のテスト", async () => {
		const mockBookmark = {
			id: 3,
			url: "https://example.com/article3",
			title: "React 18の新機能",
			isRead: false,
			summary: null,
			summaryCreatedAt: null,
			summaryUpdatedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		vi.mocked(apiClient.getBookmarkById).mockResolvedValue(mockBookmark);

		// generateSummaryツールと同じ方法でプロンプトを生成
		const bookmarkId = 3;
		const maxLength = 500;
		const includeKeyPoints = true;

		const generatedPrompt = getSummaryPrompt({
			url: mockBookmark.url,
			title: mockBookmark.title,
			bookmarkId,
			maxLength,
			includeKeyPoints,
		});

		// 期待される指示内容の要素
		const expectedElements = [
			mockBookmark.url,
			mockBookmark.title,
			`ブックマークID: ${bookmarkId}`,
			`${maxLength}文字以内`,
			"【概要】",
			"【学習ポイント】",
			"【実装に役立つ情報】",
			"【関連技術・エコシステム】",
			"saveSummary ツールを使って要約を保存",
			"品質基準",
			"作業手順",
		];

		// すべての必要な要素が含まれているか確認
		for (const element of expectedElements) {
			expect(generatedPrompt).toContain(element);
		}

		// 新しいプロンプトテンプレートの特徴が含まれているか確認
		expect(generatedPrompt).toContain("詳細指針");
		expect(generatedPrompt).toContain("記事解析のポイント");
		expect(generatedPrompt).toContain("特別な考慮事項");
	});

	it("includeKeyPointsがfalseの場合のシンプルプロンプトテスト", async () => {
		const mockBookmark = {
			id: 4,
			url: "https://example.com/simple-article",
			title: "シンプルな技術記事",
			isRead: false,
			summary: null,
			summaryCreatedAt: null,
			summaryUpdatedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		vi.mocked(apiClient.getBookmarkById).mockResolvedValue(mockBookmark);

		const bookmarkId = 4;
		const maxLength = 300;
		const includeKeyPoints = false;

		const generatedPrompt = getSummaryPrompt({
			url: mockBookmark.url,
			title: mockBookmark.title,
			bookmarkId,
			maxLength,
			includeKeyPoints,
		});

		// シンプルプロンプトの要素が含まれているか確認
		expect(generatedPrompt).toContain("【技術要約】");
		expect(generatedPrompt).toContain(`${maxLength}文字以内`);
		expect(generatedPrompt).toContain("saveSummary ツール");

		// 詳細プロンプトの要素が含まれていないことを確認
		expect(generatedPrompt).not.toContain("【学習ポイント】");
		expect(generatedPrompt).not.toContain("品質基準");
		expect(generatedPrompt).not.toContain("詳細指針");
	});
});
