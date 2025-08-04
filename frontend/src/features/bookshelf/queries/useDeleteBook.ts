/**
 * 本棚アイテムを削除するカスタムフック
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBook } from "./api";
import { bookshelfKeys } from "./queryKeys";

export const useDeleteBook = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => deleteBook(id),
		onSuccess: () => {
			// 本棚リストのキャッシュを無効化
			queryClient.invalidateQueries({ queryKey: bookshelfKeys.lists() });
		},
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
		deleteBook: vi.fn(),
	}));

	describe("useDeleteBook", () => {
		const createWrapper = () => {
			const queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false },
					mutations: { retry: false },
				},
			});
			return ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					QueryClientProvider,
					{ client: queryClient },
					children,
				);
		};

		it("本棚アイテムを削除できる", async () => {
			const { deleteBook } = await import("./api");
			(deleteBook as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

			const { result } = renderHook(() => useDeleteBook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(1);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(deleteBook).toHaveBeenCalledWith(1);
		});

		it("エラー時に適切にハンドリングする", async () => {
			const { deleteBook } = await import("./api");
			(deleteBook as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Failed to delete book"),
			);

			const { result } = renderHook(() => useDeleteBook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(1);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error?.message).toBe("Failed to delete book");
		});
	});
}
