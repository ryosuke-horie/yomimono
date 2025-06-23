/**
 * 記事評価API クライアントの包括的テスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CreateRatingData,
	createArticleRating,
	type GetRatingsOptions,
	getArticleRating,
	getArticleRatings,
	getRatingStats,
	type UpdateRatingData,
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

		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/123/rating",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(ratingData),
			},
		);
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
			"https://api.example.com/api/bookmarks/123/rating",
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
			"https://api.example.com/api/bookmarks/123/rating",
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

describe("getArticleRatings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	it("評価一覧を正常に取得する", async () => {
		const mockRatings = [mockRating, { ...mockRating, id: 2, articleId: 124 }];

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				ratings: mockRatings,
				count: mockRatings.length,
			}),
		});

		const options: GetRatingsOptions = {
			sortBy: "totalScore",
			order: "desc",
			limit: 10,
		};

		const result = await getArticleRatings(options);

		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/ratings?sortBy=totalScore&order=desc&limit=10",
		);
		expect(result).toEqual(mockRatings);
	});

	it("フィルターオプション付きで評価一覧を取得する", async () => {
		const mockRatings = [mockRating];

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				ratings: mockRatings,
				count: mockRatings.length,
			}),
		});

		const options: GetRatingsOptions = {
			minScore: 8,
			maxScore: 10,
			hasComment: true,
			offset: 20,
		};

		const result = await getArticleRatings(options);

		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/ratings?offset=20&minScore=8&maxScore=10&hasComment=true",
		);
		expect(result).toEqual(mockRatings);
	});

	it("オプションなしで評価一覧を取得する", async () => {
		const mockRatings = [mockRating];

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				ratings: mockRatings,
				count: mockRatings.length,
			}),
		});

		const result = await getArticleRatings();

		expect(fetch).toHaveBeenCalledWith("https://api.example.com/api/ratings?");
		expect(result).toEqual(mockRatings);
	});

	it("API エラー時にエラーを投げる", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: "Server Error",
		});

		await expect(getArticleRatings()).rejects.toThrow(
			"Failed to get article ratings: Server Error",
		);
	});
});

describe("getRatingStats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	it("評価統計情報を正常に取得する", async () => {
		const mockStats = {
			totalRatings: 100,
			averageScore: 7.5,
			dimensionAverages: {
				practicalValue: 8.0,
				technicalDepth: 7.8,
				understanding: 7.2,
				novelty: 6.5,
				importance: 7.8,
			},
			scoreDistribution: {
				"1-2": 5,
				"3-4": 10,
				"5-6": 25,
				"7-8": 45,
				"9-10": 15,
			},
		};

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				stats: {
					...mockStats,
					medianScore: 7.6,
					scoreDistribution: [
						{ range: "1-2", count: 5, percentage: 5.0 },
						{ range: "3-4", count: 10, percentage: 10.0 },
						{ range: "5-6", count: 25, percentage: 25.0 },
						{ range: "7-8", count: 45, percentage: 45.0 },
						{ range: "9-10", count: 15, percentage: 15.0 },
					],
					topRatedArticles: [],
				},
			}),
		});

		const result = await getRatingStats();

		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/ratings/stats",
		);
		expect(result.totalRatings).toBe(mockStats.totalRatings);
		expect(result.averageScore).toBe(mockStats.averageScore);
		expect(result.dimensionAverages).toEqual(mockStats.dimensionAverages);
	});

	it("API エラー時にエラーを投げる", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: "Service Unavailable",
		});

		await expect(getRatingStats()).rejects.toThrow(
			"Failed to get rating stats: Service Unavailable",
		);
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("記事評価APIクライアント関数が正しくエクスポートされている", () => {
		expect(createArticleRating).toBeDefined();
		expect(getArticleRating).toBeDefined();
		expect(updateArticleRating).toBeDefined();
		expect(getArticleRatings).toBeDefined();
		expect(getRatingStats).toBeDefined();

		expect(typeof createArticleRating).toBe("function");
		expect(typeof getArticleRating).toBe("function");
		expect(typeof updateArticleRating).toBe("function");
		expect(typeof getArticleRatings).toBe("function");
		expect(typeof getRatingStats).toBe("function");
	});
}
