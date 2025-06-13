/**
 * ビジネスロジックに関連する例外クラス
 * アプリケーション固有のビジネスルール違反や業務エラーを定義
 */
import { BaseError } from "./base";

/**
 * データベース操作に関するエラー
 */
export class DatabaseError extends BaseError {
	constructor(message = "Database operation failed", originalError?: Error) {
		super(message, 500, true);
		if (originalError) {
			this.stack = originalError.stack;
		}
	}
}

/**
 * 外部サービスとの通信エラー
 */
export class ExternalServiceError extends BaseError {
	constructor(
		message = "External service error",
		public readonly serviceName?: string,
		originalError?: Error,
	) {
		super(message, 502, true);
		if (originalError) {
			this.stack = originalError.stack;
		}
	}
}

/**
 * リソースが既に存在する場合のエラー
 */
export class DuplicateResourceError extends BaseError {
	constructor(
		message = "Resource already exists",
		public readonly resourceType?: string,
		public readonly identifier?: string,
	) {
		super(message, 409, true);
	}
}

/**
 * 処理のタイムアウトエラー
 */
export class TimeoutError extends BaseError {
	constructor(
		message = "Operation timed out",
		public readonly timeout?: number,
	) {
		super(message, 504, true);
	}
}

/**
 * レート制限エラー
 */
export class RateLimitError extends BaseError {
	constructor(
		message = "Rate limit exceeded",
		public readonly retryAfter?: number,
	) {
		super(message, 429, true);
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("DatabaseError はデータベースエラーを生成する", () => {
		const error = new DatabaseError();
		expect(error.statusCode).toBe(500);
		expect(error.message).toBe("Database operation failed");
		expect(error.isOperational).toBe(true);

		const originalError = new Error("Connection lost");
		const wrappedError = new DatabaseError(
			"Failed to save bookmark",
			originalError,
		);
		expect(wrappedError.message).toBe("Failed to save bookmark");
		expect(wrappedError.stack).toBe(originalError.stack);
	});

	test("ExternalServiceError は外部サービスエラーを生成する", () => {
		const error = new ExternalServiceError("RSS fetch failed", "RSS Parser");
		expect(error.statusCode).toBe(502);
		expect(error.serviceName).toBe("RSS Parser");
	});

	test("DuplicateResourceError は重複リソースエラーを生成する", () => {
		const error = new DuplicateResourceError(
			"Bookmark already exists",
			"bookmark",
			"https://example.com",
		);
		expect(error.statusCode).toBe(409);
		expect(error.resourceType).toBe("bookmark");
		expect(error.identifier).toBe("https://example.com");
	});

	test("ExternalServiceError で元エラーのスタックトレースを保持する", () => {
		const originalError = new Error("Network timeout");
		const wrappedError = new ExternalServiceError(
			"Service unavailable",
			"API Gateway",
			originalError,
		);
		expect(wrappedError.message).toBe("Service unavailable");
		expect(wrappedError.serviceName).toBe("API Gateway");
		expect(wrappedError.stack).toBe(originalError.stack);
	});

	test("TimeoutError はタイムアウト情報を保持する", () => {
		const error = new TimeoutError("Request timeout", 5000);
		expect(error.statusCode).toBe(504);
		expect(error.message).toBe("Request timeout");
		expect(error.timeout).toBe(5000);
	});

	test("RateLimitError は再試行時間を保持する", () => {
		const error = new RateLimitError("Too many requests", 60);
		expect(error.statusCode).toBe(429);
		expect(error.message).toBe("Too many requests");
		expect(error.retryAfter).toBe(60);
	});
}
