/**
 * 本の更新用カスタムフック
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Book, CreateBookInput } from "../types";
import { updateBook } from "./api";
import { bookshelfKeys } from "./queryKeys";

export type UpdateBookInput = CreateBookInput & {
	id: string;
};

export function useUpdateBook() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateBookInput) => {
			const { id, ...updateData } = data;
			// idをnumberに変換（文字列の場合）
			const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id;
			return updateBook(numericId, updateData);
		},
		onSuccess: (updatedBook: Book) => {
			// 本一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: bookshelfKeys.all,
			});
			// 特定の本のキャッシュを更新
			queryClient.setQueryData(
				bookshelfKeys.detail(updatedBook.id),
				updatedBook,
			);
		},
		onError: (error) => {
			console.error("本の更新に失敗しました:", error);
		},
	});
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { renderHook, waitFor } = await import("@testing-library/react");
	const React = await import("react");
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const { BookType } = await import("../types");

	// APIモジュールをモック
	vi.mock("./api", () => ({
		updateBook: vi.fn(),
	}));

	describe("useUpdateBook", () => {
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

		it("本の更新が成功する", async () => {
			const { updateBook } = await import("./api");
			const mockBook = {
				id: "1",
				title: "更新された本",
				type: BookType.BOOK,
				url: null,
				imageUrl: null,
				status: "unread" as const,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			(updateBook as ReturnType<typeof vi.fn>).mockResolvedValue(mockBook);

			const { result } = renderHook(() => useUpdateBook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				id: "1",
				title: "更新された本",
				type: BookType.BOOK,
				url: null,
				imageUrl: null,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(updateBook).toHaveBeenCalledWith(1, {
				title: "更新された本",
				type: BookType.BOOK,
				url: null,
				imageUrl: null,
			});
		});

		it("本の更新が失敗する", async () => {
			const { updateBook } = await import("./api");
			const mockError = new Error("更新失敗");
			(updateBook as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { result } = renderHook(() => useUpdateBook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				id: "1",
				title: "更新される本",
				type: BookType.BOOK,
				url: null,
				imageUrl: null,
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"本の更新に失敗しました:",
				mockError,
			);

			consoleSpy.mockRestore();
		});
	});
}
