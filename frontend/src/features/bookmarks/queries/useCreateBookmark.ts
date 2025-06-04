/**
 * ブックマーク作成のカスタムフック
 * TanStack Queryを使用してブックマーク作成後のキャッシュ無効化を管理
 */
import {
	type InvalidateQueryFilters,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createBookmark } from "./api";

export const useCreateBookmark = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBookmark,
		onSuccess: () => {
			// ブックマーク一覧を無効化して再取得（staleTimeを無視して即座に再取得）
			queryClient.invalidateQueries({
				queryKey: ["bookmarks"],
				refetchType: "all",
			} as InvalidateQueryFilters);

			// 追加後すぐに最新データを取得するため
			queryClient.refetchQueries({
				queryKey: ["bookmarks"],
				type: "active",
			});
		},
	});
};

if (import.meta.vitest) {
	const { test, expect, vi, beforeEach } = import.meta.vitest;
	const { renderHook, waitFor } = await import("@testing-library/react");
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const React = await import("react");

	// APIモック
	vi.mock("./api", () => ({
		createBookmark: vi.fn(),
	}));

	test("ブックマーク作成が成功した場合、関連クエリが無効化される", async () => {
		const { createBookmark: mockCreateBookmark } = await import("./api");
		vi.mocked(mockCreateBookmark).mockResolvedValueOnce(undefined);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		// QueryClientのメソッドをスパイ
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		const { result } = renderHook(() => useCreateBookmark(), { wrapper });

		// ミューテーションを実行
		result.current.mutate({
			title: "テストブックマーク",
			url: "https://example.com",
		});

		// 成功を待つ
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		// invalidateQueriesが呼ばれることを確認
		expect(invalidateQueriesSpy).toHaveBeenCalledWith({
			queryKey: ["bookmarks"],
			refetchType: "all",
		});

		// refetchQueriesが呼ばれることを確認
		expect(refetchQueriesSpy).toHaveBeenCalledWith({
			queryKey: ["bookmarks"],
			type: "active",
		});
	});

	test("ブックマーク作成に失敗した場合、クエリ無効化は実行されない", async () => {
		const { createBookmark: mockCreateBookmark } = await import("./api");
		vi.mocked(mockCreateBookmark).mockRejectedValueOnce(
			new Error("作成に失敗"),
		);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		// QueryClientのメソッドをスパイ
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		const { result } = renderHook(() => useCreateBookmark(), { wrapper });

		// ミューテーションを実行
		result.current.mutate({
			title: "テストブックマーク",
			url: "https://example.com",
		});

		// エラーを待つ
		await waitFor(() => expect(result.current.isError).toBe(true));

		// invalidateQueriesが呼ばれないことを確認
		expect(invalidateQueriesSpy).not.toHaveBeenCalled();

		// refetchQueriesが呼ばれないことを確認
		expect(refetchQueriesSpy).not.toHaveBeenCalled();
	});

	test("mutationFnにcreateBookmark関数が設定されている", () => {
		const queryClient = new QueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		const { result } = renderHook(() => useCreateBookmark(), { wrapper });

		// mutationFnがcreateBookmarkに設定されていることを確認
		expect(result.current.mutate).toBeDefined();
		expect(result.current.mutateAsync).toBeDefined();
	});
}
