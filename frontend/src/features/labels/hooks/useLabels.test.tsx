import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * useLabels カスタムフックの単体テスト
 * 状態管理部分のテスト（API部分はモック）
 */
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLabels } from "./useLabels";

// fetch APIのモック
global.fetch = vi.fn();

// テスト用のQueryClientプロバイダー
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				gcTime: 0,
			},
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("useLabels", () => {
	let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

	beforeEach(() => {
		wrapper = createWrapper();
		vi.clearAllMocks();
	});

	it("初期状態が正しく設定される", () => {
		// fetchをモックして失敗させる（ローディング状態をテスト）
		vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useLabels(), { wrapper });

		expect(result.current.labels).toEqual([]);
		expect(result.current.selectedLabelName).toBeUndefined();
		expect(result.current.isLoading).toBe(true);
		expect(typeof result.current.setSelectedLabelName).toBe("function");
	});

	it("ラベル選択が正しく動作する", () => {
		// fetchをモックして失敗させる（状態管理のテストに集中）
		vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useLabels(), { wrapper });

		// ラベルを選択
		act(() => {
			result.current.setSelectedLabelName("JavaScript");
		});

		expect(result.current.selectedLabelName).toBe("JavaScript");
	});

	it("ラベル選択を解除できる", () => {
		// fetchをモックして失敗させる
		vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useLabels(), { wrapper });

		// ラベルを選択
		act(() => {
			result.current.setSelectedLabelName("JavaScript");
		});
		expect(result.current.selectedLabelName).toBe("JavaScript");

		// 選択を解除
		act(() => {
			result.current.setSelectedLabelName(undefined);
		});
		expect(result.current.selectedLabelName).toBeUndefined();
	});

	it("複数回レンダリングされても安定している", () => {
		// fetchをモックして失敗させる
		vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

		const { result, rerender } = renderHook(() => useLabels(), { wrapper });

		const firstSetSelectedLabelName = result.current.setSelectedLabelName;

		rerender();

		const secondSetSelectedLabelName = result.current.setSelectedLabelName;

		// useCallbackによりリレンダリング時も同じ関数参照が維持される
		expect(firstSetSelectedLabelName).toBe(secondSetSelectedLabelName);
	});
});
