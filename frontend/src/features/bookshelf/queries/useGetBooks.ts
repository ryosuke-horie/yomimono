/**
 * 本棚アイテム一覧を取得するカスタムフック
 */

import { useQuery } from "@tanstack/react-query";
import type { BookStatusValue } from "@/features/bookshelf/types";
import { getBooks } from "./api";
import { bookshelfKeys } from "./queryKeys";

export const useGetBooks = (status?: BookStatusValue) => {
	return useQuery({
		queryKey: bookshelfKeys.list(status),
		queryFn: () => getBooks(status),
		staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
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
		getBooks: vi.fn(),
	}));

	describe("useGetBooks", () => {
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

		it("ステータスフィルターなしで本棚アイテムを取得できる", async () => {
			const mockBooks = [
				{
					id: 1,
					type: "book" as const,
					title: "テスト書籍",
					url: null,
					imageUrl: null,
					status: "unread" as const,
					completedAt: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			const { getBooks } = await import("./api");
			(getBooks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBooks);

			const { result } = renderHook(() => useGetBooks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockBooks);
		});

		it("ステータスフィルター付きで本棚アイテムを取得できる", async () => {
			const mockBooks = [
				{
					id: 2,
					type: "pdf" as const,
					title: "読書中PDF",
					url: "https://example.com/test.pdf",
					imageUrl: null,
					status: "reading" as const,
					completedAt: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			const { getBooks } = await import("./api");
			(getBooks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBooks);

			const { result } = renderHook(() => useGetBooks("reading"), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockBooks);
			expect(getBooks).toHaveBeenCalledWith("reading");
		});
	});
}
