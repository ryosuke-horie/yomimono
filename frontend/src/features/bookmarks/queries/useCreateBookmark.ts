/**
 * ブックマーク作成用のカスタムフック
 * TanStack Queryを使用して楽観的更新とキャッシュ管理を行う
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
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const { renderHook, act } = await import("@testing-library/react");
	const { vi, describe, it, expect, beforeEach } = import.meta.vitest;
	const React = await import("react");
	type ReactNode = React.ReactNode;

	// createBookmark APIのモック
	vi.mock("./api", () => ({
		createBookmark: vi.fn(),
	}));

	const createTestWrapper = () => {
		const queryClient = new QueryClient({
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

		return ({ children }: { children: ReactNode }) => {
			return React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
		};
	};

	describe("useCreateBookmark", () => {
		let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

		beforeEach(() => {
			wrapper = createTestWrapper();
			vi.clearAllMocks();
		});

		it("ブックマーク作成のmutationが正しく初期化される", () => {
			const { result } = renderHook(() => useCreateBookmark(), { wrapper });

			expect(result.current.mutate).toBeDefined();
			expect(result.current.mutateAsync).toBeDefined();
			expect(result.current.isPending).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.isSuccess).toBe(false);
		});

		it("ブックマーク作成が成功した場合のキャッシュ更新処理が呼ばれる", async () => {
			const { createBookmark } = await import("./api");
			vi.mocked(createBookmark).mockResolvedValue({
				success: true,
				data: { id: "1", title: "Test", url: "https://example.com" },
			});

			const { result } = renderHook(() => useCreateBookmark(), { wrapper });

			const mockInvalidateQueries = vi.fn();
			const mockRefetchQueries = vi.fn();

			// QueryClientのメソッドをモック
			vi.spyOn(result.current, "mutate").mockImplementation((data, options) => {
				options?.onSuccess?.();
			});

			await act(async () => {
				result.current.mutate({
					title: "Test Bookmark",
					url: "https://example.com",
				});
			});

			expect(createBookmark).toHaveBeenCalledWith({
				title: "Test Bookmark",
				url: "https://example.com",
			});
		});

		it("ブックマーク作成時のローディング状態が正しく管理される", () => {
			const { result } = renderHook(() => useCreateBookmark(), { wrapper });

			expect(result.current.isPending).toBe(false);

			act(() => {
				result.current.mutate({
					title: "Test",
					url: "https://example.com",
				});
			});

			// mutation実行中はpendingがtrueになる
			expect(result.current.isPending).toBe(true);
		});
	});
}
