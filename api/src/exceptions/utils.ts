/**
 * エラーハンドリングのユーティリティ関数
 * エラー処理に関する共通ロジックを提供
 */
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { BaseError } from "./base";

/**
 * ステータスコードがContentfulStatusCodeとして有効かどうかを判定し、
 * 無効な場合は500に変換する
 */
export function toContentfulStatusCode(
	statusCode: number,
): ContentfulStatusCode {
	// ContentfulStatusCode は 200-599 の範囲で、1xx は含まない
	if (statusCode >= 200 && statusCode <= 599) {
		return statusCode as ContentfulStatusCode;
	}
	// 1xx やその他の無効なコードは500に変換
	return 500;
}

/**
 * エラーレスポンスの生成
 */
export function createErrorResponse(error: unknown): {
	success: false;
	message: string;
	statusCode: number;
} {
	if (error instanceof BaseError) {
		return {
			success: false,
			message: error.message,
			statusCode: error.statusCode,
		};
	}

	if (error instanceof HTTPException) {
		return {
			success: false,
			message: error.message,
			statusCode: error.status,
		};
	}

	if (error instanceof Error) {
		return {
			success: false,
			message: error.message,
			statusCode: 500,
		};
	}

	return {
		success: false,
		message: "Unknown error occurred",
		statusCode: 500,
	};
}

/**
 * エラーレスポンスボディの生成（statusCodeを含まない）
 */
export function createErrorResponseBody(error: unknown): {
	success: false;
	message: string;
} {
	const response = createErrorResponse(error);
	return {
		success: response.success,
		message: response.message,
	};
}
