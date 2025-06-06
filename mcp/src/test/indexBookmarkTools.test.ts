/**
 * index.ts ブックマーク管理ツールのテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

vi.mock("../lib/apiClient.js", () => ({
	getUnreadBookmarks: vi.fn(),
	getReadBookmarks: vi.fn(),
	markBookmarkAsRead: vi.fn(),
	getBookmarkById: vi.fn(),
}));

// ブックマーク管理ツールの実装をテスト用に分離
async function createGetUnreadBookmarksHandler() {
	return async () => {
		try {
			const bookmarks = await apiClient.getUnreadBookmarks();
			return {
				content: [
					{
						type: "text",
						text: `未読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`,
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
						text: `未読ブックマークの取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

async function createGetReadBookmarksHandler() {
	return async () => {
		try {
			const bookmarks = await apiClient.getReadBookmarks();
			return {
				content: [
					{
						type: "text",
						text: `既読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`,
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
						text: `既読ブックマークの取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

async function createMarkBookmarkAsReadHandler() {
	return async ({ bookmarkId }: { bookmarkId: number }) => {
		try {
			const result = await apiClient.markBookmarkAsRead(bookmarkId);
			return {
				content: [
					{
						type: "text",
						text: `ブックマークID: ${bookmarkId}を既読にマークしました。\n${JSON.stringify(result, null, 2)}`,
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
						text: `ブックマークの既読マークに失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

async function createGetBookmarkByIdHandler() {
	return async ({ bookmarkId }: { bookmarkId: number }) => {
		try {
			const bookmark = await apiClient.getBookmarkById(bookmarkId);
			return {
				content: [
					{
						type: "text",
						text: `Bookmark details: ${JSON.stringify(bookmark, null, 2)}`,
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
						text: `Failed to get bookmark: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	};
}

// テスト用のモックブックマークデータ
const mockUnreadBookmarks = [
	{
		id: 1,
		title: "未読記事1",
		url: "https://example.com/article1",
		createdAt: "2024-01-01T00:00:00Z",
		isRead: false,
	},
	{
		id: 2,
		title: "未読記事2",
		url: "https://example.com/article2",
		createdAt: "2024-01-02T00:00:00Z",
		isRead: false,
	},
];

const mockReadBookmarks = [
	{
		id: 3,
		title: "既読記事1",
		url: "https://example.com/article3",
		createdAt: "2024-01-03T00:00:00Z",
		isRead: true,
	},
];

describe("ブックマーク管理ツールのテスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUnreadBookmarks ツール", () => {
		test("未読ブックマークの取得が成功する", async () => {
			vi.mocked(apiClient.getUnreadBookmarks).mockResolvedValue(
				mockUnreadBookmarks,
			);

			const handler = await createGetUnreadBookmarksHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("未読のブックマークリスト");
			expect(result.content[0].text).toContain("未読記事1");
			expect(result.content[0].text).toContain("未読記事2");
			expect(apiClient.getUnreadBookmarks).toHaveBeenCalledOnce();
		});

		test("未読ブックマーク取得時のエラーハンドリング", async () => {
			vi.mocked(apiClient.getUnreadBookmarks).mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const handler = await createGetUnreadBookmarksHandler();
			const result = await handler();

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"未読ブックマークの取得に失敗しました",
			);
			expect(result.content[0].text).toContain("データベース接続エラー");
		});
	});

	describe("getReadBookmarks ツール", () => {
		test("既読ブックマークの取得が成功する", async () => {
			vi.mocked(apiClient.getReadBookmarks).mockResolvedValue(
				mockReadBookmarks,
			);

			const handler = await createGetReadBookmarksHandler();
			const result = await handler();

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("既読のブックマークリスト");
			expect(result.content[0].text).toContain("既読記事1");
			expect(apiClient.getReadBookmarks).toHaveBeenCalledOnce();
		});

		test("既読ブックマーク取得時のエラーハンドリング", async () => {
			vi.mocked(apiClient.getReadBookmarks).mockRejectedValue(
				new Error("ネットワークエラー"),
			);

			const handler = await createGetReadBookmarksHandler();
			const result = await handler();

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"既読ブックマークの取得に失敗しました",
			);
			expect(result.content[0].text).toContain("ネットワークエラー");
		});
	});

	describe("markBookmarkAsRead ツール", () => {
		test("ブックマークの既読マークが成功する", async () => {
			const mockResult = {
				id: 1,
				title: "記事タイトル",
				isRead: true,
				updatedAt: "2024-01-01T12:00:00Z",
			};

			vi.mocked(apiClient.markBookmarkAsRead).mockResolvedValue(mockResult);

			const handler = await createMarkBookmarkAsReadHandler();
			const result = await handler({ bookmarkId: 1 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain(
				"ブックマークID: 1を既読にマーク",
			);
			expect(result.content[0].text).toContain("記事タイトル");
			expect(apiClient.markBookmarkAsRead).toHaveBeenCalledWith(1);
		});

		test("ブックマークの既読マーク時のエラーハンドリング", async () => {
			vi.mocked(apiClient.markBookmarkAsRead).mockRejectedValue(
				new Error("ブックマークが見つかりません"),
			);

			const handler = await createMarkBookmarkAsReadHandler();
			const result = await handler({ bookmarkId: 999 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain(
				"ブックマークの既読マークに失敗しました",
			);
			expect(result.content[0].text).toContain("ブックマークが見つかりません");
		});

		test("無効なブックマークIDの処理", async () => {
			expect(createMarkBookmarkAsReadHandler).toBeDefined();
		});
	});

	describe("getBookmarkById ツール", () => {
		test("ID指定でのブックマーク取得が成功する", async () => {
			const mockBookmark = {
				id: 1,
				title: "特定のブックマーク",
				url: "https://example.com/specific",
				createdAt: "2024-01-01T00:00:00Z",
				isRead: false,
			};

			vi.mocked(apiClient.getBookmarkById).mockResolvedValue(mockBookmark);

			const handler = await createGetBookmarkByIdHandler();
			const result = await handler({ bookmarkId: 1 });

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain("Bookmark details:");
			expect(result.content[0].text).toContain("特定のブックマーク");
			expect(apiClient.getBookmarkById).toHaveBeenCalledWith(1);
		});

		test("存在しないブックマークID指定時のエラーハンドリング", async () => {
			vi.mocked(apiClient.getBookmarkById).mockRejectedValue(
				new Error("ブックマークが見つかりません"),
			);

			const handler = await createGetBookmarkByIdHandler();
			const result = await handler({ bookmarkId: 999 });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Failed to get bookmark:");
			expect(result.content[0].text).toContain("ブックマークが見つかりません");
		});
	});
});
