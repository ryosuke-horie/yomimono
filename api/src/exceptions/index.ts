/**
 * 例外クラスのエクスポート
 * アプリケーション全体で使用される例外をまとめてエクスポート
 */

// 基底クラス
export { BaseError, HttpError } from "./base";
// HTTPエラー
export {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "./http";

// エラーハンドリングユーティリティ
export {
	createErrorResponse,
	createErrorResponseBody,
	toContentfulStatusCode,
} from "./utils";

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("公開している例外クラスがエクスポートされている", async () => {
		const exports = await import("./index");

		// 基底クラス
		expect(exports.BaseError).toBeDefined();
		expect(exports.HttpError).toBeDefined();

		// HTTPエラー
		expect(exports.BadRequestError).toBeDefined();
		expect(exports.ConflictError).toBeDefined();
		expect(exports.NotFoundError).toBeDefined();
		expect(exports.ValidationError).toBeDefined();
		expect(exports.InternalServerError).toBeDefined();
	});
}
