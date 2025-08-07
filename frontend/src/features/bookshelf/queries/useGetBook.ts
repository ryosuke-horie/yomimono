/**
 * 特定の本棚アイテムを取得するカスタムフック
 */

import { useQuery } from "@tanstack/react-query";
import { getBook } from "./api";
import { bookshelfKeys } from "./queryKeys";

export const useGetBook = (id: number) => {
	return useQuery({
		queryKey: bookshelfKeys.detail(id),
		queryFn: () => getBook(id),
		staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
		enabled: Number.isInteger(id) && id > 0, // 有効なIDの場合のみクエリを実行
	});
};

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { renderHook, waitFor } = await import("@testing-library/react");
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const React = await import("react");

	vi.mock("./api", () => ({
		getBook: vi.fn(),
	}));

	describe("useGetBook", () => {
		const createWrapper = () => {
			const queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false },
				},
			});
			return ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					QueryClientProvider,
					{ client: queryClient },
					children,
				);
		};

		it("特定の本棚アイテムを取得できる", async () => {
			const mockBook = {
				id: 1,
				type: "book" as const,
				title: "テスト書籍",
				url: null,
				imageUrl: "https://example.com/image.jpg",
				status: "unread" as const,
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			const { getBook } = await import("./api");
			(getBook as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBook);

			const { result } = renderHook(() => useGetBook(1), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockBook);
			expect(getBook).toHaveBeenCalledWith(1);
		});

		it("無効なIDの場合はクエリを実行しない", async () => {
			const { getBook } = await import("./api");

			renderHook(() => useGetBook(0), {
				wrapper: createWrapper(),
			});

			expect(getBook).not.toHaveBeenCalled();
		});

		it("整数以外のIDの場合はクエリを実行しない", async () => {
			const { getBook } = await import("./api");

			// 小数の場合
			renderHook(() => useGetBook(1.5), {
				wrapper: createWrapper(),
			});

			expect(getBook).not.toHaveBeenCalled();
		});

		it("エラー時に適切にハンドリングする", async () => {
			const { getBook } = await import("./api");
			(getBook as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Book not found"),
			);

			const { result } = renderHook(() => useGetBook(999), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error?.message).toBe("Book not found");
		});
	});
}
