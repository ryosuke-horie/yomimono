/**
 * 記事評価API クライアントのテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CreateRatingData,
	type UpdateRatingData,
	createArticleRating,
	getArticleRating,
	updateArticleRating,
} from "../lib/apiClient.js";

// モックレスポンス
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

// fetch のモック
global.fetch = vi.fn();

describe("createArticleRating", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	it("記事評価を正常に作成する", async () => {
		const ratingData: CreateRatingData = {
			practicalValue: 8,
			technicalDepth: 9,
			understanding: 7,
			novelty: 6,
			importance: 8,
			comment: "非常に有用な記事でした",
		};

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				rating: mockRating,
			}),
		});

		const result = await createArticleRating(123, ratingData);

		expect(fetch).toHaveBeenCalledWith("https://api.example.com/api/ratings", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				articleId: 123,
				...ratingData,
			}),
		});
		expect(result).toEqual(mockRating);
	});

	it("API エラー時にエラーを投げる", async () => {
		const ratingData: CreateRatingData = {
			practicalValue: 8,
			technicalDepth: 9,
			understanding: 7,
			novelty: 6,
			importance: 8,
		};

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: "Bad Request",
		});

		await expect(createArticleRating(123, ratingData)).rejects.toThrow(
			"Failed to create rating for article 123: Bad Request",
		);
	});
});

describe("getArticleRating", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	it("記事評価を正常に取得する", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				rating: mockRating,
			}),
		});

		const result = await getArticleRating(123);

		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/ratings/article/123",
		);
		expect(result).toEqual(mockRating);
	});

	it("評価が存在しない場合にnullを返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: "Not Found",
		});

		const result = await getArticleRating(123);
		expect(result).toBeNull();
	});

	it("API エラー時にエラーを投げる", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		});

		await expect(getArticleRating(123)).rejects.toThrow(
			"Failed to get rating for article 123: Internal Server Error",
		);
	});
});

describe("updateArticleRating", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	it("記事評価を正常に更新する", async () => {
		const updateData: UpdateRatingData = {
			practicalValue: 9,
			comment: "更新されたコメント",
		};

		const updatedRating = {
			...mockRating,
			practicalValue: 9,
			totalScore: 39,
			comment: "更新されたコメント",
		};

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				rating: updatedRating,
			}),
		});

		const result = await updateArticleRating(123, updateData);

		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/ratings/article/123",
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			},
		);
		expect(result).toEqual(updatedRating);
	});

	it("評価が存在しない場合にエラーを投げる", async () => {
		const updateData: UpdateRatingData = {
			practicalValue: 9,
		};

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: "Not Found",
		});

		await expect(updateArticleRating(123, updateData)).rejects.toThrow(
			"Failed to update rating for article 123: Not Found",
		);
	});
});
