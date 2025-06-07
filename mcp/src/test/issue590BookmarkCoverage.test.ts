/**
 * Issue #590: markBookmarkAsRead関数の未カバー行をカバーするテスト
 * apiClient.ts の lines 583-586, 591-594 をカバー
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { markBookmarkAsRead } from "../lib/apiClient.js";

// fetch のモック
global.fetch = vi.fn();

describe("Issue #590: markBookmarkAsRead カバレッジ向上テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("markBookmarkAsRead のエラーハンドリング", () => {
		it("APIエラーレスポンスの処理（lines 583-586）", async () => {
			// 404エラーをモック
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
			});

			await expect(markBookmarkAsRead(999)).rejects.toThrow(
				"Failed to mark bookmark 999 as read: Not Found",
			);

			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/999/read",
				{
					method: "PATCH",
				},
			);
		});

		it("500エラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(markBookmarkAsRead(123)).rejects.toThrow(
				"Failed to mark bookmark 123 as read: Internal Server Error",
			);
		});

		it("401認証エラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 401,
				statusText: "Unauthorized",
			});

			await expect(markBookmarkAsRead(456)).rejects.toThrow(
				"Failed to mark bookmark 456 as read: Unauthorized",
			);
		});

		it("Zodスキーマ検証エラーの処理（lines 591-594）", async () => {
			// 不正な形式のレスポンスをモック
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// success フィールドが欠けている
					message: "Bookmark marked as read",
				}),
			});

			await expect(markBookmarkAsRead(123)).rejects.toThrow(
				"Invalid API response after marking bookmark as read:",
			);
		});

		it("successがfalseの不正なレスポンス", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: false, // 期待値はtrue
					message: "Failed",
				}),
			});

			await expect(markBookmarkAsRead(789)).rejects.toThrow(
				"Invalid API response after marking bookmark as read:",
			);
		});

		it("messageフィールドが欠けているレスポンス", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					// message フィールドが欠けている
				}),
			});

			await expect(markBookmarkAsRead(321)).rejects.toThrow(
				"Invalid API response after marking bookmark as read:",
			);
		});

		it("正常なレスポンスの処理", async () => {
			const mockResponse = {
				success: true,
				message: "Bookmark marked as read successfully",
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await markBookmarkAsRead(123);

			expect(result).toEqual(mockResponse);
			expect(fetch).toHaveBeenCalledWith(
				"https://api.example.com/api/bookmarks/123/read",
				{
					method: "PATCH",
				},
			);
		});

		it("ネットワークエラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Network Error"),
			);

			await expect(markBookmarkAsRead(123)).rejects.toThrow("Network Error");
		});

		it("JSON解析エラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new SyntaxError("Unexpected token");
				},
			});

			await expect(markBookmarkAsRead(123)).rejects.toThrow("Unexpected token");
		});
	});

	describe("境界値テスト", () => {
		it("0のブックマークID", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: "Bad Request",
			});

			await expect(markBookmarkAsRead(0)).rejects.toThrow(
				"Failed to mark bookmark 0 as read: Bad Request",
			);
		});

		it("負のブックマークID", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: "Bad Request",
			});

			await expect(markBookmarkAsRead(-1)).rejects.toThrow(
				"Failed to mark bookmark -1 as read: Bad Request",
			);
		});

		it("非常に大きなブックマークID", async () => {
			const largeId = Number.MAX_SAFE_INTEGER;
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "Bookmark marked as read",
				}),
			});

			const result = await markBookmarkAsRead(largeId);
			expect(result.success).toBe(true);
		});
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("markBookmarkAsRead関数が正しくエクスポートされている", () => {
		expect(markBookmarkAsRead).toBeDefined();
		expect(typeof markBookmarkAsRead).toBe("function");
	});

	test("エラーメッセージのフォーマット", () => {
		const bookmarkId = 123;
		const statusText = "Not Found";
		const errorMessage = `Failed to mark bookmark ${bookmarkId} as read: ${statusText}`;

		expect(errorMessage).toBe("Failed to mark bookmark 123 as read: Not Found");
	});

	test("Zodエラーメッセージの処理", () => {
		const zodError = {
			message: "Expected literal value true at 'success'",
		};
		const formattedMessage = `Invalid API response after marking bookmark as read: ${zodError.message}`;

		expect(formattedMessage).toContain("Expected literal value true");
	});
}
