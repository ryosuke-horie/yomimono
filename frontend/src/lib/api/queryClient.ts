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
