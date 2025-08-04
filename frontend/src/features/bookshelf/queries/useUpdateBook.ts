/**
 * 本を更新するためのカスタムフック
 * TanStack Queryを使用して本の更新を行う
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateBookInput } from "../types";
import { updateBook } from "./api";

export function useUpdateBook() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateBookInput }) =>
			updateBook(id, data),
		onSuccess: () => {
			// 成功時にキャッシュを無効化
			queryClient.invalidateQueries({ queryKey: ["books"] });
		},
	});
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;

	// 必要な依存関係をモック
	vi.mock("@tanstack/react-query", () => ({
		useMutation: vi.fn((options) => ({
			mutate: vi.fn((data) => options.mutationFn(data)),
			isPending: false,
		})),
		useQueryClient: vi.fn(() => ({
			invalidateQueries: vi.fn(),
		})),
	}));

	vi.mock("./api", () => ({
		updateBook: vi.fn(() => Promise.resolve({ id: 1, title: "Updated" })),
	}));

	describe("useUpdateBook", () => {
		it("updateBook APIを呼び出す", async () => {
			const { updateBook: mockUpdateBook } = await import("./api");
			const hook = useUpdateBook();

			const testData = {
				id: 123,
				data: { title: "New Title" },
			};

			await hook.mutate(testData);

			expect(mockUpdateBook).toHaveBeenCalledWith(123, {
				title: "New Title",
			});
		});

		it("成功時にキャッシュを無効化する", async () => {
			const { useMutation, useQueryClient } = await import(
				"@tanstack/react-query"
			);
			const mockInvalidateQueries = vi.fn();

			(useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue({
				invalidateQueries: mockInvalidateQueries,
			});

			let onSuccessCallback: (() => void) | undefined;
			(useMutation as ReturnType<typeof vi.fn>).mockImplementation(
				(options) => {
					onSuccessCallback = options.onSuccess;
					return {
						mutate: vi.fn(),
						isPending: false,
					};
				},
			);

			useUpdateBook();

			// onSuccessコールバックを実行
			if (onSuccessCallback) {
				onSuccessCallback();
			}

			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["books"],
			});
		});
	});
}
