/**
 * QueryClient のグローバル設定とエラーハンドリング
 */

import { QueryClient } from "@tanstack/react-query";
import { API_ERROR_CODES, ApiError, getErrorMessage } from "./errors";

// グローバルなToast表示関数を保持する変数
let globalShowToast:
	| ((options: {
			type: "success" | "error" | "info";
			message: string;
			duration?: number;
	  }) => void)
	| null = null;

/**
 * グローバルなToast表示関数を設定
 */
export function setGlobalShowToast(
	showToast: (options: {
		type: "success" | "error" | "info";
		message: string;
		duration?: number;
	}) => void,
) {
	globalShowToast = showToast;
}

/**
 * エラーをToastで表示するハンドラー
 */
function handleGlobalError(error: unknown) {
	if (!globalShowToast) {
		// Toast関数が設定されていない場合はconsole.errorにフォールバック
		console.error("Global error handler not initialized:", error);
		return;
	}

	const message = getErrorMessage(error);

	// ApiErrorの場合、エラーコードに応じて表示時間を調整
	let duration = 5000;
	if (error instanceof ApiError) {
		// ネットワークエラーやサーバーエラーの場合は長めに表示
		if (
			error.code === API_ERROR_CODES.NETWORK_ERROR ||
			error.code === API_ERROR_CODES.SERVER_ERROR
		) {
			duration = 7000;
		}
	}

	globalShowToast({
		type: "error",
		message,
		duration,
	});
}

/**
 * QueryClient のデフォルト設定を作成
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// staleTimeを設定すると、指定時間内はキャッシュが新鮮とみなされ、
				// マウント時やウィンドウフォーカス時などに自動再取得が行われなくなる
				staleTime: 1000 * 60 * 5, // 5 minutes
				// refetchOnWindowFocus: false, // 必要ならウィンドウフォーカス時の再取得を無効化
			},
			mutations: {
				// グローバルエラーハンドリング
				onError: handleGlobalError,
			},
		},
	});
}

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi, beforeEach } = import.meta.vitest;

	describe("queryClient", () => {
		beforeEach(() => {
			// グローバル変数をリセット
			globalShowToast = null;
		});

		describe("setGlobalShowToast", () => {
			test("グローバルなToast関数を設定できる", () => {
				const mockShowToast = vi.fn();
				setGlobalShowToast(mockShowToast);

				// handleGlobalErrorを直接呼び出してテスト
				handleGlobalError(new Error("Test error"));

				expect(mockShowToast).toHaveBeenCalledWith({
					type: "error",
					message: "Test error",
					duration: 5000,
				});
			});
		});

		describe("handleGlobalError", () => {
			test("Toast関数が設定されていない場合はconsole.errorを呼ぶ", () => {
				const consoleSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});

				handleGlobalError(new Error("Test error"));

				expect(consoleSpy).toHaveBeenCalledWith(
					"Global error handler not initialized:",
					expect.any(Error),
				);

				consoleSpy.mockRestore();
			});

			test("ApiErrorのネットワークエラーの場合、長めの表示時間を設定", () => {
				const mockShowToast = vi.fn();
				setGlobalShowToast(mockShowToast);

				const error = new ApiError(
					"Network error",
					API_ERROR_CODES.NETWORK_ERROR,
				);
				handleGlobalError(error);

				expect(mockShowToast).toHaveBeenCalledWith({
					type: "error",
					message: "接続エラーが発生しました。ネットワークを確認してください。",
					duration: 7000,
				});
			});

			test("ApiErrorのサーバーエラーの場合、長めの表示時間を設定", () => {
				const mockShowToast = vi.fn();
				setGlobalShowToast(mockShowToast);

				const error = new ApiError(
					"Server error",
					API_ERROR_CODES.SERVER_ERROR,
				);
				handleGlobalError(error);

				expect(mockShowToast).toHaveBeenCalledWith({
					type: "error",
					message:
						"サーバーエラーが発生しました。しばらく待ってから再試行してください。",
					duration: 7000,
				});
			});

			test("通常のエラーの場合、デフォルトの表示時間を設定", () => {
				const mockShowToast = vi.fn();
				setGlobalShowToast(mockShowToast);

				handleGlobalError(new Error("Normal error"));

				expect(mockShowToast).toHaveBeenCalledWith({
					type: "error",
					message: "Normal error",
					duration: 5000,
				});
			});
		});

		describe("createQueryClient", () => {
			test("適切なデフォルト設定でQueryClientを作成する", () => {
				const client = createQueryClient();

				// QueryClient のインスタンスが作成されることを確認
				expect(client).toBeInstanceOf(QueryClient);

				// デフォルトオプションが設定されていることを確認
				const defaultOptions = client.getDefaultOptions();
				expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5);
				expect(defaultOptions.mutations?.onError).toBeDefined();
			});
		});
	});
}
