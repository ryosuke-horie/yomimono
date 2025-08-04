/**
 * テストユーティリティ
 * Vitestと@testing-library/reactの共通設定
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	render as rtlRender,
	renderHook as rtlRenderHook,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

// Re-export everything
export * from "@testing-library/react";
export { userEvent, vi, test, expect };

// テスト用のQueryClientを作成する関数
function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// テストでは再試行を無効化
				retry: false,
				// テストでは即座にガベージコレクション
				gcTime: 0,
			},
			mutations: {
				// テストでは再試行を無効化
				retry: false,
			},
		},
	});
}

// Providerラッパーコンポーネント
function AllTheProviders({ children }: { children: ReactNode }) {
	const queryClient = createTestQueryClient();

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

// Custom render with providers
export function render(ui: ReactElement, options = {}) {
	return rtlRender(ui, {
		wrapper: AllTheProviders,
		...options,
	});
}

export function renderHook<TProps, TResult>(
	callback: (props: TProps) => TResult,
	options = {},
) {
	return rtlRenderHook(callback, {
		wrapper: AllTheProviders,
		...options,
	});
}

// User event setup
export const user = userEvent.setup();
