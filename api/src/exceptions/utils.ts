/**
 * エラーハンドリングのユーティリティ関数
 * エラー処理に関する共通ロジックを提供
 */
import { HTTPException } from "hono/http-exception";
import { BaseError } from "./base";

/**
 * エラーが運用上のエラー（想定内のエラー）かどうかを判定
 */
export function isOperationalError(error: unknown): boolean {
	if (error instanceof BaseError) {
		return error.isOperational;
	}
	if (error instanceof HTTPException) {
		return true;
	}
	return false;
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

/**
 * エラーメッセージを安全に取得
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "Unknown error";
}

/**
 * HTTPExceptionをカスタムエラーに変換
 */
export function fromHttpException(exception: HTTPException): BaseError {
	const message = exception.message || "HTTP Error";
	const statusCode = exception.status;

	class HttpExceptionWrapper extends BaseError {
		constructor() {
			super(message, statusCode, true);
		}
	}

	return new HttpExceptionWrapper();
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("isOperationalError は運用エラーを正しく判定する", () => {
		class TestError extends BaseError {
			constructor() {
				super("Test", 500, true);
			}
		}
		const baseError = new TestError();
		const httpException = new HTTPException(404, { message: "Not Found" });
		const normalError = new Error("Normal error");

		expect(isOperationalError(baseError)).toBe(true);
		expect(isOperationalError(httpException)).toBe(true);
		expect(isOperationalError(normalError)).toBe(false);
		expect(isOperationalError("string error")).toBe(false);
		expect(isOperationalError(null)).toBe(false);
	});

	test("createErrorResponse はエラーレスポンスを生成する", () => {
		class TestError extends BaseError {
			constructor() {
				super("Custom error", 400, true);
			}
		}
		const baseError = new TestError();
		const response1 = createErrorResponse(baseError);
		expect(response1).toEqual({
			success: false,
			message: "Custom error",
			statusCode: 400,
		});

		const httpException = new HTTPException(404, { message: "Not Found" });
		const response2 = createErrorResponse(httpException);
		expect(response2).toEqual({
			success: false,
			message: "Not Found",
			statusCode: 404,
		});

		const normalError = new Error("Normal error");
		const response3 = createErrorResponse(normalError);
		expect(response3).toEqual({
			success: false,
			message: "Normal error",
			statusCode: 500,
		});

		const response4 = createErrorResponse("string error");
		expect(response4).toEqual({
			success: false,
			message: "Unknown error occurred",
			statusCode: 500,
		});
	});

	test("getErrorMessage はエラーメッセージを安全に取得する", () => {
		expect(getErrorMessage(new Error("Test error"))).toBe("Test error");
		expect(getErrorMessage("String error")).toBe("String error");
		expect(getErrorMessage(null)).toBe("Unknown error");
		expect(getErrorMessage(undefined)).toBe("Unknown error");
		expect(getErrorMessage(123)).toBe("Unknown error");
	});
}
