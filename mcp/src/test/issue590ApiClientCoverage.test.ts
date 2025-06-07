/**
 * Issue #590: apiClient.tsの未カバーラインをカバーするテスト
 * 特にlines 689-692, 750-753のカバレッジ向上
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CreateRatingData,
	type UpdateRatingData,
	createArticleRating,
	getArticleRating,
	updateArticleRating,
} from "../lib/apiClient.js";

// fetch のモック
global.fetch = vi.fn();

describe("Issue #590: apiClient.ts カバレッジ向上テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	describe("createArticleRating の詳細なエラーハンドリング", () => {
		it("JSON解析エラー時の処理（lines 689-692をカバー）", async () => {
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "テスト評価",
			};

			// 不正なJSONレスポンスをモック
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

			// 非Errorオブジェクトでの拒否をモック
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

			// 不正な形式のレスポンスをモック
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					rating: {
						// 必須フィールドが欠けている
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
		it("JSON解析エラー時の処理（lines 750-753をカバー）", async () => {
			// HTMLレスポンスなどが返ってきた場合をモック
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
