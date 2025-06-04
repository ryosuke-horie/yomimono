/**
 * 最近読んだブックマーク一覧を取得するカスタムフック
 * TanStack Queryを使用してキャッシュと再取得を管理
 */
import { useQuery } from "@tanstack/react-query";
import { getRecentlyReadBookmarks } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useGetRecentBookmarks = () => {
	return useQuery({
		queryKey: bookmarkKeys.list("recent"), // クエリキーを設定
		queryFn: getRecentlyReadBookmarks, // APIリクエスト関数
	});
};

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;
	const { renderHook, waitFor } = await import("@testing-library/react");
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const React = await import("react");

	// APIモック
	vi.mock("./api", () => ({
		getRecentlyReadBookmarks: vi.fn(),
	}));

	// queryKeysモック
	vi.mock("./queryKeys", () => ({
		bookmarkKeys: {
			list: vi.fn((type: string) => ["bookmarks", type]),
		},
	}));

	test("最近読んだブックマークの取得が成功する", async () => {
		const mockData = {
			"2024-01-01": [
				{
					id: 1,
					title: "テスト記事1",
					url: "https://example.com/1",
					createdAt: "2024-01-01T10:00:00Z",
					updatedAt: "2024-01-01T10:00:00Z",
					isRead: true,
					isFavorite: false,
					label: null,
				},
			],
			"2024-01-02": [
				{
					id: 2,
					title: "テスト記事2",
					url: "https://example.com/2",
					createdAt: "2024-01-02T11:00:00Z",
					updatedAt: "2024-01-02T11:00:00Z",
					isRead: true,
					isFavorite: true,
					label: null,
				},
			],
		};

		const { getRecentlyReadBookmarks: mockGetRecentlyReadBookmarks } =
			await import("./api");
		vi.mocked(mockGetRecentlyReadBookmarks).mockResolvedValueOnce(mockData);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		const { result } = renderHook(() => useGetRecentBookmarks(), { wrapper });

		// 初期状態では読み込み中
		expect(result.current.isLoading).toBe(true);

		// 成功を待つ
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		// データが正しく取得されることを確認
		expect(result.current.data).toEqual(mockData);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	test("最近読んだブックマークの取得が失敗する", async () => {
		const { getRecentlyReadBookmarks: mockGetRecentlyReadBookmarks } =
			await import("./api");
		vi.mocked(mockGetRecentlyReadBookmarks).mockRejectedValueOnce(
			new Error("API エラー"),
		);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		const { result } = renderHook(() => useGetRecentBookmarks(), { wrapper });

		// エラーを待つ
		await waitFor(() => expect(result.current.isError).toBe(true));

		// エラー状態が正しく設定されることを確認
		expect(result.current.data).toBeUndefined();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeInstanceOf(Error);
	});

	test("正しいクエリキーとクエリ関数が使用される", async () => {
		const { bookmarkKeys: mockBookmarkKeys } = await import("./queryKeys");
		const { getRecentlyReadBookmarks: mockGetRecentlyReadBookmarks } =
			await import("./api");

		// モック関数の戻り値を設定
		vi.mocked(mockGetRecentlyReadBookmarks).mockResolvedValueOnce({});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		renderHook(() => useGetRecentBookmarks(), { wrapper });

		// mockBookmarkKeys.listが呼ばれることを確認
		expect(mockBookmarkKeys.list).toHaveBeenCalledWith("recent");
	});
}
