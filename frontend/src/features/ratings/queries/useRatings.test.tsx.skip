import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
/**
 * useRatingsフックのテスト
 */
import { expect, test, vi } from "vitest";
import { fetchRatings } from "./api";
import { useRatings } from "./useRatings";

if (import.meta.vitest) {
	// APIモック
	vi.mock("./api", () => ({
		fetchRatings: vi.fn(),
	}));

	const createWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	test("useRatings - データ取得成功", async () => {
		const mockData = [
			{
				rating: {
					id: 1,
					articleId: 123,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					totalScore: 76,
					comment: "参考になりました",
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
				},
				article: {
					id: 123,
					url: "https://example.com",
					title: "テスト記事",
					isRead: false,
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
				},
			},
		];

		vi.mocked(fetchRatings).mockResolvedValue(mockData);

		const { result } = renderHook(
			() => useRatings({ sortBy: "totalScore", order: "desc" }),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual(mockData);
		expect(result.current.error).toBeNull();
		expect(fetchRatings).toHaveBeenCalledWith({
			sortBy: "totalScore",
			order: "desc",
		});
	});

	test("useRatings - エラー処理", async () => {
		const mockError = new Error("取得に失敗しました");
		vi.mocked(fetchRatings).mockRejectedValue(mockError);

		const { result } = renderHook(() => useRatings(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(mockError);
		expect(result.current.data).toBeUndefined();
	});

	test("useRatings - フィルターなしでの呼び出し", async () => {
		vi.mocked(fetchRatings).mockResolvedValue([]);

		const { result } = renderHook(() => useRatings(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(fetchRatings).toHaveBeenCalledWith(undefined);
	});
}
