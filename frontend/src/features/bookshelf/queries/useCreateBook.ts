/**
 * 本棚アイテムを作成するカスタムフック
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateBookInput } from "@/features/bookshelf/types";
import { createBook } from "./api";
import { bookshelfKeys } from "./queryKeys";

export const useCreateBook = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateBookInput) => createBook(input),
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
		createBook: vi.fn(),
	}));

	describe("useCreateBook", () => {
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

		it("新しい本棚アイテムを作成できる", async () => {
			const mockBook = {
				id: 1,
				type: "book" as const,
				title: "新しい書籍",
				url: null,
				imageUrl: "https://example.com/image.jpg",
				status: "unread" as const,
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			const { createBook } = await import("./api");
			(createBook as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBook);

			const { result } = renderHook(() => useCreateBook(), {
				wrapper: createWrapper(),
			});

			const input: CreateBookInput = {
				type: "book",
				title: "新しい書籍",
				imageUrl: "https://example.com/image.jpg",
			};

			result.current.mutate(input);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockBook);
			expect(createBook).toHaveBeenCalledWith(input);
		});

		it("エラー時に適切にハンドリングする", async () => {
			const { createBook } = await import("./api");
			(createBook as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Failed to create book"),
			);

			const { result } = renderHook(() => useCreateBook(), {
				wrapper: createWrapper(),
			});

			const input: CreateBookInput = {
				type: "pdf",
				title: "エラーテスト",
			};

			result.current.mutate(input);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error?.message).toBe("Failed to create book");
		});
	});
}
