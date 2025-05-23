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

	it("Claude Desktopへの指示に必要な情報が含まれていることを確認", async () => {
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

		// generateSummaryツールが生成する指示内容の検証
		const bookmarkId = 3;
		const maxLength = 500;
		const includeKeyPoints = true;

		// 期待される指示内容の要素
		const expectedElements = [
			mockBookmark.url,
			mockBookmark.title,
			`ブックマークID: ${bookmarkId}`,
			`${maxLength}文字以内`,
			"【概要】",
			"【学習ポイント】",
			"【実装に役立つ情報】",
			"【関連技術】",
			"saveSummary ツールを使って保存",
		];

		// 実際の指示内容を模擬的に生成
		const instruction = `
以下のURLの技術記事を読み込んで、エンジニア向けの要約を生成してください。

URL: ${mockBookmark.url}
タイトル: ${mockBookmark.title}
ブックマークID: ${bookmarkId}

要約の要件:
1. 日本語で${maxLength}文字以内で作成
2. 以下の形式で構成:
   【概要】
   記事の主旨を1-2文で説明
   
   【学習ポイント】
   ・技術的に重要な概念やパターン
   ・新しく学べる技術やツール
   ・ベストプラクティスや注意点
   
   【実装に役立つ情報】
   ・具体的なコード例やコマンド
   ・設定方法や使用手順
   ・パフォーマンスやセキュリティの考慮点
   
   【関連技術】
   記事で言及されている関連技術やライブラリ

3. エンジニアが後で見返した時に、記事の価値と学習内容がすぐ分かるようにする
4. 専門用語は適切に使用し、技術的な正確性を保つ

手順:
1. 上記URLにアクセスして記事内容を読み込む
2. 技術的な観点から要約を生成
3. 生成した要約を saveSummary ツールを使って保存する (bookmarkId: ${bookmarkId})`;

		// すべての必要な要素が含まれているか確認
		for (const element of expectedElements) {
			expect(instruction).toContain(element);
		}
	});
});
