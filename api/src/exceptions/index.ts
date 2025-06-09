/**
 * 例外クラスのエクスポート
 * アプリケーション全体で使用される例外をまとめてエクスポート
 */

// 基底クラス
export { BaseError, HttpError } from "./base";

// HTTPエラー
export {
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError,
	ValidationError,
	InternalServerError,
	ServiceUnavailableError,
} from "./http";

// ビジネスエラー
export {
	DatabaseError,
	ExternalServiceError,
	DuplicateResourceError,
	TimeoutError,
	RSSError,
	RateLimitError,
} from "./business";

// エラーハンドリングユーティリティ
export {
	isOperationalError,
	createErrorResponse,
	createErrorResponseBody,
} from "./utils";

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("すべての例外クラスがエクスポートされている", async () => {
		const exports = await import("./index");

		// 基底クラス
		expect(exports.BaseError).toBeDefined();
		expect(exports.HttpError).toBeDefined();

		// HTTPエラー
		expect(exports.BadRequestError).toBeDefined();
		expect(exports.NotFoundError).toBeDefined();
		expect(exports.ValidationError).toBeDefined();
		expect(exports.InternalServerError).toBeDefined();

		// ビジネスエラー
		expect(exports.DatabaseError).toBeDefined();
		expect(exports.RSSError).toBeDefined();
	});
}
