import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import { BaseError } from "./base";
import {
	createErrorResponse,
	createErrorResponseBody,
	toContentfulStatusCode,
} from "./utils";

class TestBaseError extends BaseError {
	constructor() {
		super("Custom error", 400, true);
	}
}

describe("toContentfulStatusCode", () => {
	test("有効なステータスコードはそのまま返し、無効なコードは500に変換する", () => {
		expect(toContentfulStatusCode(200)).toBe(200);
		expect(toContentfulStatusCode(404)).toBe(404);
		expect(toContentfulStatusCode(500)).toBe(500);
		expect(toContentfulStatusCode(100)).toBe(500);
		expect(toContentfulStatusCode(101)).toBe(500);
		expect(toContentfulStatusCode(600)).toBe(500);
		expect(toContentfulStatusCode(-1)).toBe(500);
	});
});

describe("createErrorResponse", () => {
	test("BaseError, HTTPException, 通常のError、その他のエラーを適切に処理する", () => {
		const baseError = new TestBaseError();
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
});

describe("createErrorResponseBody", () => {
	test("statusCodeを含まないレスポンスボディを返す", () => {
		const error = new TestBaseError();
		const response = createErrorResponseBody(error);

		expect(response).toEqual({
			success: false,
			message: "Custom error",
		});
		expect(response).not.toHaveProperty("statusCode");
	});
});
