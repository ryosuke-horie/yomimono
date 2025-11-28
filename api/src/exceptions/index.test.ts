import { expect, test } from "vitest";

test("公開している例外クラスがエクスポートされている", async () => {
	const exports = await import("./index");

	expect(exports.BaseError).toBeDefined();
	expect(exports.HttpError).toBeDefined();
	expect(exports.BadRequestError).toBeDefined();
	expect(exports.ConflictError).toBeDefined();
	expect(exports.NotFoundError).toBeDefined();
	expect(exports.ValidationError).toBeDefined();
	expect(exports.InternalServerError).toBeDefined();
});

test("エラーハンドリングユーティリティがエクスポートされている", async () => {
	const exports = await import("./index");

	expect(exports.createErrorResponse).toBeTypeOf("function");
	expect(exports.createErrorResponseBody).toBeTypeOf("function");
	expect(exports.toContentfulStatusCode).toBeTypeOf("function");
});
