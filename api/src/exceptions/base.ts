/**
 * カスタム例外の基底クラス
 * アプリケーション内で発生するすべてのカスタム例外はこのクラスを継承する
 */
export abstract class BaseError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		// エラー名をクラス名に設定
		this.name = this.constructor.name;

		// スタックトレースを正しく設定
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * HTTPエラーレスポンスの基底クラス
 * HTTPステータスコードと関連付けられたエラー
 */
export abstract class HttpError extends BaseError {
	constructor(message: string, statusCode: number) {
		super(message, statusCode, true);
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("BaseError はカスタムエラーの基本機能を提供する", () => {
		class TestError extends BaseError {
			constructor(message: string) {
				super(message, 500, true);
			}
		}

		const error = new TestError("Test error");
		expect(error.message).toBe("Test error");
		expect(error.statusCode).toBe(500);
		expect(error.isOperational).toBe(true);
		expect(error.name).toBe("TestError");
		expect(error instanceof BaseError).toBe(true);
		expect(error instanceof Error).toBe(true);
	});

	test("HttpError はHTTPエラーの基本機能を提供する", () => {
		class TestHttpError extends HttpError {
			constructor(message: string) {
				super(message, 404);
			}
		}

		const error = new TestHttpError("Not Found");
		expect(error.message).toBe("Not Found");
		expect(error.statusCode).toBe(404);
		expect(error.isOperational).toBe(true);
		expect(error instanceof HttpError).toBe(true);
		expect(error instanceof BaseError).toBe(true);
	});
}
