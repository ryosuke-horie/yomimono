/**
 * 例外クラスのエクスポート
 * アプリケーション全体で使用される例外をまとめてエクスポート
 */

// 基底クラス
export { BaseError, HttpError } from "./base";
// ビジネスエラー
export {
	DatabaseError,
	DuplicateResourceError,
	ExternalServiceError,
	RateLimitError,
	TimeoutError,
} from "./business";
// HTTPエラー
export {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
	ServiceUnavailableError,
	UnauthorizedError,
	ValidationError,
} from "./http";

// エラーハンドリングユーティリティ
export {
	createErrorResponse,
	createErrorResponseBody,
	isOperationalError,
	toContentfulStatusCode,
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
	});
}
