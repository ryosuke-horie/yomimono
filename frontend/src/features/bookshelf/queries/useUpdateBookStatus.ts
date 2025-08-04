/**
 * 本棚アイテムのステータスを更新するカスタムフック
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookStatusValue } from "@/features/bookshelf/types";
import { updateBookStatus } from "./api";
import { bookshelfKeys } from "./queryKeys";

interface UpdateBookStatusParams {
	id: number;
	status: BookStatusValue;
}

export const useUpdateBookStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, status }: UpdateBookStatusParams) =>
			updateBookStatus(id, status),
		onSuccess: (data) => {
			// 更新されたアイテムの詳細キャッシュを更新
			queryClient.setQueryData(bookshelfKeys.detail(data.id), data);
			// リストのキャッシュを無効化
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
		updateBookStatus: vi.fn(),
	}));

	describe("useUpdateBookStatus", () => {
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

		it("本棚アイテムのステータスを更新できる", async () => {
			const mockBook = {
				id: 1,
				type: "book" as const,
				title: "テスト書籍",
				url: null,
				imageUrl: null,
				status: "completed" as const,
				completedAt: "2024-01-02T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			const { updateBookStatus } = await import("./api");
			(updateBookStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockBook,
			);

			const { result } = renderHook(() => useUpdateBookStatus(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ id: 1, status: "completed" });

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockBook);
			expect(updateBookStatus).toHaveBeenCalledWith(1, "completed");
		});

		it("ステータスを「読書中」に更新できる", async () => {
			const mockBook = {
				id: 2,
				type: "pdf" as const,
				title: "テストPDF",
				url: "https://example.com/test.pdf",
				imageUrl: null,
				status: "reading" as const,
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			const { updateBookStatus } = await import("./api");
			(updateBookStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockBook,
			);

			const { result } = renderHook(() => useUpdateBookStatus(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ id: 2, status: "reading" });

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data?.status).toBe("reading");
		});
	});
}
