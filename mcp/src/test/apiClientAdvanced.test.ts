/**
 * apiClient.ts の高度なエラーハンドリングと境界値テスト
 * 旧issue590ApiClientCoverage.test.ts, issue590BookmarkCoverage.test.ts, issue590Final50Coverage.test.tsから統合
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CreateRatingData,
	type UpdateRatingData,
	createArticleRating,
	deleteArticleRating,
	getArticleRating,
	getReadBookmarks,
	getUnreadArticlesByLabel,
	getUnreadBookmarks,
	markBookmarkAsRead,
	updateArticleRating,
} from "../lib/apiClient.js";

// fetch のモック
global.fetch = vi.fn();

describe("apiClient.ts 高度なテスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("createArticleRating の詳細なエラーハンドリング", () => {
		it("JSON解析エラー時の処理", async () => {
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "テスト評価",
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new SyntaxError("Unexpected token < in JSON at position 0");
				},
			});

			await expect(createArticleRating(123, ratingData)).rejects.toThrow(
				"Failed to parse response when creating rating for article 123: Unexpected token < in JSON at position 0",
			);
		});

		it("非Errorオブジェクトによるjson()メソッドの失敗", async () => {
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw "String error";
				},
			});

			await expect(createArticleRating(123, ratingData)).rejects.toThrow(
				"Failed to parse response when creating rating for article 123: String error",
			);
		});

		it("Zodバリデーションエラーの詳細なメッセージ", async () => {
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					rating: {
						id: 1,
						articleId: 123,
						// practicalValue が欠けている
					},
				}),
			});

			await expect(createArticleRating(123, ratingData)).rejects.toThrow(
				"Invalid API response after creating rating:",
			);
		});
	});

	describe("getArticleRating の詳細なエラーハンドリング", () => {
		it("JSON解析エラー時の処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => {
					throw new Error("Response is not JSON");
				},
			});

			await expect(getArticleRating(123)).rejects.toThrow(
				"Failed to parse response when getting rating for article 123: Response is not JSON",
			);
		});

		it("非Errorオブジェクトでのパースエラー", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => {
					throw { code: "PARSE_ERROR", message: "Invalid response" };
				},
			});

			await expect(getArticleRating(123)).rejects.toThrow(
				"Failed to parse response when getting rating for article 123: [object Object]",
			);
		});

		it("404以外のエラーステータスでの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(getArticleRating(123)).rejects.toThrow(
				"Failed to get rating for article 123: Internal Server Error",
			);
		});

		it("Zodバリデーションエラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					// rating フィールドが欠けている
				}),
			});

			await expect(getArticleRating(123)).rejects.toThrow(
				"Invalid API response for rating 123:",
			);
		});
	});

	describe("updateArticleRating の詳細なエラーハンドリング", () => {
		it("JSON解析エラー時の処理", async () => {
			const updateData: UpdateRatingData = {
				practicalValue: 9,
				comment: "更新コメント",
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new TypeError("Failed to parse JSON");
				},
			});

			await expect(updateArticleRating(123, updateData)).rejects.toThrow(
				"Failed to parse response when updating rating for article 123: Failed to parse JSON",
			);
		});

		it("文字列エラーでのパースエラー", async () => {
			const updateData: UpdateRatingData = {
				understanding: 8,
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw "Unexpected server response";
				},
			});

			await expect(updateArticleRating(123, updateData)).rejects.toThrow(
				"Failed to parse response when updating rating for article 123: Unexpected server response",
			);
		});

		it("nullやundefinedでのパースエラー", async () => {
			const updateData: UpdateRatingData = {
				novelty: 7,
			};

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw null;
				},
			});

			await expect(updateArticleRating(123, updateData)).rejects.toThrow(
				"Failed to parse response when updating rating for article 123: null",
			);
		});
	});

	describe("markBookmarkAsRead のエラーハンドリング", () => {
		it("APIエラーレスポンスの処理", async () => {
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

		it("Zodスキーマ検証エラーの処理", async () => {
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
	});

	describe("getUnreadBookmarks の詳細なエラーハンドリング", () => {
		it("APIエラーレスポンスの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 503,
				statusText: "Service Unavailable",
			});

			await expect(getUnreadBookmarks()).rejects.toThrow(
				"Failed to fetch unread bookmarks: Service Unavailable",
			);
		});

		it("Zodスキーマ検証エラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// successフィールドが欠けている不正なレスポンス
					bookmarks: [
						{
							id: 1,
							url: "https://example.com",
							title: "Test",
							labels: [],
							isRead: false,
							isFavorite: false,
							createdAt: "2024-01-01T00:00:00Z",
							readAt: null,
						},
					],
				}),
			});

			await expect(getUnreadBookmarks()).rejects.toThrow(
				"Invalid API response for unread bookmarks:",
			);
		});
	});

	describe("getUnreadArticlesByLabel のエラーハンドリング", () => {
		it("APIエラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: "Bad Request",
			});

			await expect(getUnreadArticlesByLabel("非存在ラベル")).rejects.toThrow(
				'Failed to fetch unread articles for label "非存在ラベル": Bad Request',
			);
		});

		it("Zodスキーマ検証エラーの処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// 不正な構造
					articles: [], // 正しくは bookmarks フィールド
				}),
			});

			await expect(getUnreadArticlesByLabel("テストラベル")).rejects.toThrow(
				"Invalid API response for unread articles by label:",
			);
		});
	});

	describe("getReadBookmarks のエラーハンドリング", () => {
		it("APIエラー時の処理", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(getReadBookmarks()).rejects.toThrow(
				"Failed to fetch read bookmarks: Internal Server Error",
			);
		});

		it("Zodスキーマ検証エラー", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// successフィールドが欠けている
					bookmarks: [],
				}),
			});

			await expect(getReadBookmarks()).rejects.toThrow(
				"Invalid API response for read bookmarks:",
			);
		});
	});

	describe("deleteArticleRating のエラーハンドリング", () => {
		it("エラーハンドリング", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
			});

			await expect(deleteArticleRating(999)).rejects.toThrow(
				"Failed to delete rating for article 999: Not Found",
			);
		});
	});

	describe("エラーハンドリングの境界ケース", () => {
		it("エラーメッセージがundefinedの場合", async () => {
			const handleError = (error: unknown): string => {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return errorMessage;
			};

			const undefinedError = undefined;
			expect(handleError(undefinedError)).toBe("undefined");
		});

		it("複雑なオブジェクトエラーの処理", async () => {
			const complexError = {
				code: "ERR_NETWORK",
				details: {
					host: "api.example.com",
					port: 443,
				},
				toString() {
					return "Network Error";
				},
			};

			const handleError = (error: unknown): string => {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return errorMessage;
			};

			expect(handleError(complexError)).toBe("Network Error");
		});

		it("循環参照を持つオブジェクトエラー", async () => {
			const circularError: { name: string; self?: unknown } = {
				name: "CircularError",
			};
			circularError.self = circularError;

			const handleError = (error: unknown): string => {
				try {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return errorMessage;
				} catch {
					return "Error processing failed";
				}
			};

			const result = handleError(circularError);
			expect(result).toContain("object Object");
		});
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("エラーハンドリングのヘルパー関数", () => {
		const getErrorMessage = (error: unknown): string => {
			if (error instanceof Error) {
				return error.message;
			}
			return String(error);
		};

		expect(getErrorMessage(new Error("Test error"))).toBe("Test error");
		expect(getErrorMessage("String error")).toBe("String error");
		expect(getErrorMessage(123)).toBe("123");
		expect(getErrorMessage(null)).toBe("null");
		expect(getErrorMessage(undefined)).toBe("undefined");
		expect(getErrorMessage({ error: "object" })).toBe("[object Object]");
	});

	test("parseError処理のパターン", () => {
		const processParseError = (parseError: unknown): string => {
			const errorMessage =
				parseError instanceof Error ? parseError.message : String(parseError);
			return `Failed to parse: ${errorMessage}`;
		};

		expect(processParseError(new SyntaxError("Invalid JSON"))).toBe(
			"Failed to parse: Invalid JSON",
		);
		expect(processParseError("Parse failed")).toBe(
			"Failed to parse: Parse failed",
		);
		expect(processParseError(undefined)).toBe("Failed to parse: undefined");
	});
}
