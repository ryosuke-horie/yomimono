/**
 * RSSフィード関連カスタムフックのテスト
 * useRSSFeeds, useUpdateRSSFeed, useDeleteRSSFeedの動作をテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteRSSFeed, useRSSFeeds, useUpdateRSSFeed } from "./useRSSFeeds";

// APIモック
vi.mock("./api", () => ({
	feedsApi: {
		getFeeds: vi.fn(),
		updateFeed: vi.fn(),
		deleteFeed: vi.fn(),
	},
}));

import { feedsApi } from "./api";

const mockFeedsApi = vi.mocked(feedsApi);

// テスト用QueryClientプロバイダー
const createTestQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});
};

const createWrapper = () => {
	const queryClient = createTestQueryClient();
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("RSSフィード関連フック", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("useRSSFeeds", () => {
		it("フィード一覧を正常に取得する", async () => {
			const mockFeeds = {
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
						lastFetchedAt: null,
					},
				],
				total: 1,
			};

			mockFeedsApi.getFeeds.mockResolvedValueOnce(mockFeeds);

			const { result } = renderHook(() => useRSSFeeds(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockFeeds);
			expect(mockFeedsApi.getFeeds).toHaveBeenCalledTimes(1);
		});

		it("取得エラー時にエラー状態になる", async () => {
			const errorMessage = "Failed to fetch feeds";
			mockFeedsApi.getFeeds.mockRejectedValueOnce(new Error(errorMessage));

			const { result } = renderHook(() => useRSSFeeds(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(errorMessage);
		});
	});

	describe("useUpdateRSSFeed", () => {
		it("フィードを正常に更新する", async () => {
			const updateData = {
				name: "Updated Feed",
				isActive: false,
			};

			const mockUpdatedFeed = {
				id: 1,
				name: "Updated Feed",
				url: "https://example.com/feed",
				isActive: false,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T12:00:00Z",
				updateInterval: 60,
				nextFetchAt: "2023-01-01T13:00:00Z",
				lastFetchedAt: null,
			};

			mockFeedsApi.updateFeed.mockResolvedValueOnce(mockUpdatedFeed);

			const { result } = renderHook(() => useUpdateRSSFeed(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ id: 1, data: updateData });

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockFeedsApi.updateFeed).toHaveBeenCalledWith(1, updateData);
			expect(result.current.data).toEqual(mockUpdatedFeed);
		});

		it("更新エラー時にエラー状態になる", async () => {
			const errorMessage = "Failed to update feed";
			mockFeedsApi.updateFeed.mockRejectedValueOnce(new Error(errorMessage));

			const { result } = renderHook(() => useUpdateRSSFeed(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				id: 1,
				data: { name: "Updated Feed" },
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(errorMessage);
		});
	});

	describe("useDeleteRSSFeed", () => {
		it("フィードを正常に削除する", async () => {
			mockFeedsApi.deleteFeed.mockResolvedValueOnce(undefined);

			const { result } = renderHook(() => useDeleteRSSFeed(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(1);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockFeedsApi.deleteFeed).toHaveBeenCalledWith(1);
		});

		it("削除エラー時にエラー状態になる", async () => {
			const errorMessage = "Failed to delete feed";
			mockFeedsApi.deleteFeed.mockRejectedValueOnce(new Error(errorMessage));

			const { result } = renderHook(() => useDeleteRSSFeed(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(1);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(errorMessage);
		});
	});
});
