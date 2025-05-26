/**
 * useCreateRSSFeedカスタムフックのテスト
 * RSSフィード作成機能をテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateRSSFeed } from "./useCreateRSSFeed";

// APIモック
vi.mock("./api", () => ({
	feedsApi: {
		createFeed: vi.fn(),
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

describe("useCreateRSSFeed", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("RSSフィードを正常に作成する", async () => {
		const createData = {
			name: "New Feed",
			url: "https://example.com/feed",
			isActive: true,
		};

		const mockCreatedFeed = {
			id: 1,
			name: "New Feed",
			url: "https://example.com/feed",
			isActive: true,
			createdAt: "2023-01-01T00:00:00Z",
			updatedAt: "2023-01-01T00:00:00Z",
			updateInterval: 60,
			nextFetchAt: "2023-01-01T01:00:00Z",
			lastFetchedAt: null,
		};

		mockFeedsApi.createFeed.mockResolvedValueOnce(mockCreatedFeed);

		const { result } = renderHook(() => useCreateRSSFeed(), {
			wrapper: createWrapper(),
		});

		result.current.mutate(createData);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(mockFeedsApi.createFeed).toHaveBeenCalledWith(createData);
		expect(result.current.data).toEqual(mockCreatedFeed);
	});

	it("作成エラー時にエラー状態になる", async () => {
		const errorMessage = "Failed to create feed";
		mockFeedsApi.createFeed.mockRejectedValueOnce(new Error(errorMessage));

		const { result } = renderHook(() => useCreateRSSFeed(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			name: "Invalid Feed",
			url: "invalid-url",
			isActive: true,
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe(errorMessage);
	});

	it("ローディング状態が正しく管理される", async () => {
		mockFeedsApi.createFeed.mockImplementation(
			() => new Promise(() => {}), // 永続的にpending
		);

		const { result } = renderHook(() => useCreateRSSFeed(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			name: "Test Feed",
			url: "https://example.com/feed",
			isActive: true,
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(true);
		});
	});

	it("作成成功時にクエリキャッシュが無効化される", async () => {
		const queryClient = createTestQueryClient();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		mockFeedsApi.createFeed.mockResolvedValueOnce({
			id: 1,
			name: "New Feed",
			url: "https://example.com/feed",
			isActive: true,
			createdAt: "2023-01-01T00:00:00Z",
			updatedAt: "2023-01-01T00:00:00Z",
			updateInterval: 60,
			nextFetchAt: "2023-01-01T01:00:00Z",
			lastFetchedAt: null,
		});

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useCreateRSSFeed(), { wrapper });

		result.current.mutate({
			name: "New Feed",
			url: "https://example.com/feed",
			isActive: true,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(invalidateQueriesSpy).toHaveBeenCalledWith({
			queryKey: ["rss-feeds", "list"],
		});
	});

	it("mutation functionが正しく設定されている", () => {
		const { result } = renderHook(() => useCreateRSSFeed(), {
			wrapper: createWrapper(),
		});

		expect(result.current.mutate).toBeDefined();
		expect(typeof result.current.mutate).toBe("function");
	});

	it("初期状態が正しく設定されている", () => {
		const { result } = renderHook(() => useCreateRSSFeed(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isPending).toBe(false);
		expect(result.current.isError).toBe(false);
		expect(result.current.isSuccess).toBe(false);
		expect(result.current.data).toBeUndefined();
		expect(result.current.error).toBeNull();
	});
});
