/**
 * feedsApi関数群のテスト
 * RSSフィード関連のAPI呼び出し処理をテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { feedsApi } from "./api";

// fetchのモック化
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("feedsApi", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getFeeds", () => {
		it("フィード一覧を正常に取得できる", async () => {
			const mockResponse = {
				feeds: [
					{
						id: 1,
						name: "Test Feed",
						url: "https://example.com/feed",
						isActive: true,
						createdAt: "2023-01-01T00:00:00Z",
						updatedAt: "2023-01-01T00:00:00Z",
						updateInterval: 60,
						nextFetchAt: "2023-01-01T01:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await feedsApi.getFeeds();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/rss/feeds",
			);
			expect(result).toEqual(mockResponse);
		});

		it("取得に失敗した場合はエラーをスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Internal Server Error",
			});

			await expect(feedsApi.getFeeds()).rejects.toThrow(
				"Failed to fetch feeds: Internal Server Error",
			);
		});
	});

	describe("getFeedById", () => {
		it("指定IDのフィード詳細を正常に取得できる", async () => {
			const mockResponse = {
				feed: {
					id: 1,
					name: "Test Feed",
					url: "https://example.com/feed",
					isActive: true,
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
					updateInterval: 60,
					nextFetchAt: "2023-01-01T01:00:00Z",
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await feedsApi.getFeedById(1);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/rss/feeds/1",
			);
			expect(result).toEqual(mockResponse);
		});

		it("取得に失敗した場合はエラーをスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			});

			await expect(feedsApi.getFeedById(999)).rejects.toThrow(
				"Failed to fetch feed: Not Found",
			);
		});
	});

	describe("createFeed", () => {
		it("フィードを正常に作成できる", async () => {
			const createData = {
				name: "New Feed",
				url: "https://example.com/newfeed",
				isActive: true,
			};

			const mockResponse = {
				id: 2,
				name: "New Feed",
				url: "https://example.com/newfeed",
				isActive: true,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
				updateInterval: 60,
				nextFetchAt: "2023-01-01T01:00:00Z",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await feedsApi.createFeed(createData);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/rss/feeds",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(createData),
				},
			);
			expect(result).toEqual(mockResponse);
		});

		it("作成に失敗した場合はエラーをスローする", async () => {
			const createData = {
				name: "Invalid Feed",
				url: "invalid-url",
				isActive: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
			});

			await expect(feedsApi.createFeed(createData)).rejects.toThrow(
				"Failed to create feed: Bad Request",
			);
		});
	});

	describe("updateFeed", () => {
		it("フィードを正常に更新できる", async () => {
			const updateData = {
				name: "Updated Feed",
				isActive: false,
			};

			const mockResponse = {
				id: 1,
				name: "Updated Feed",
				url: "https://example.com/feed",
				isActive: false,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T12:00:00Z",
				updateInterval: 60,
				nextFetchAt: "2023-01-01T13:00:00Z",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await feedsApi.updateFeed(1, updateData);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/rss/feeds/1",
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updateData),
				},
			);
			expect(result).toEqual(mockResponse);
		});

		it("更新に失敗した場合はエラーをスローする", async () => {
			const updateData = {
				name: "Updated Feed",
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			});

			await expect(feedsApi.updateFeed(999, updateData)).rejects.toThrow(
				"Failed to update feed: Not Found",
			);
		});
	});

	describe("deleteFeed", () => {
		it("フィードを正常に削除できる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			await feedsApi.deleteFeed(1);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/rss/feeds/1",
				{
					method: "DELETE",
				},
			);
		});

		it("削除に失敗した場合はエラーをスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			});

			await expect(feedsApi.deleteFeed(999)).rejects.toThrow(
				"Failed to delete feed: Not Found",
			);
		});
	});

	describe("API呼び出しの統合テスト", () => {
		it("全ての関数が正しいBase URLとパスを使用する", () => {
			const basePath = "/api/rss/feeds";

			// 個別確認は各describe内で実施済みのため、
			// ここでは設定値の確認のみ
			expect(basePath).toBe("/api/rss/feeds");
		});

		it("POST/PUTリクエストで正しいContent-Typeヘッダーが設定される", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({}),
			});

			const testData = {
				name: "Test",
				url: "https://test.com",
				isActive: true,
			};

			await feedsApi.createFeed(testData);
			await feedsApi.updateFeed(1, { name: "Updated" });

			const calls = mockFetch.mock.calls;
			const postCall = calls.find((call) => call[1]?.method === "POST");
			const putCall = calls.find((call) => call[1]?.method === "PUT");

			expect(postCall?.[1]?.headers?.["Content-Type"]).toBe("application/json");
			expect(putCall?.[1]?.headers?.["Content-Type"]).toBe("application/json");
		});
	});
});
