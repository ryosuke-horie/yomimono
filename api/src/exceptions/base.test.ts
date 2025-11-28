import { describe, expect, test } from "vitest";

import { BaseError, HttpError } from "./base";

describe("BaseError", () => {
	test("カスタムエラーの基本機能を提供する", () => {
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
});

describe("HttpError", () => {
	test("HTTPエラーの基本機能を提供する", () => {
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
});
