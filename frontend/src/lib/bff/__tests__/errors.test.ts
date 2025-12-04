import { describe, expect, test } from "vitest";

import {
	BFF_ERROR_CODES,
	BffError,
	createInvalidResponseError,
	normalizeUpstreamError,
	toErrorResponseBody,
} from "../errors";

describe("errors", () => {
	test("上流エラーをBffErrorとして正規化する", () => {
		const error = normalizeUpstreamError({
			status: 404,
			body: { message: "not found", success: false },
		});

		expect(error).toBeInstanceOf(BffError);
		expect(error.message).toBe("not found");
		expect(error.status).toBe(404);
		expect(error.code).toBe(BFF_ERROR_CODES.NOT_FOUND);
	});

	test("レスポンスを解析できない場合に専用エラーを返す", () => {
		const error = createInvalidResponseError(502, {
			raw: "invalid json",
		});

		expect(error.code).toBe(BFF_ERROR_CODES.INVALID_RESPONSE);
		expect(error.status).toBe(502);
		expect(error.message).toBe("上流APIのレスポンスを解析できませんでした。");
	});

	test("BffError以外もエラーレスポンスボディに変換する", () => {
		const normalized = toErrorResponseBody(
			new BffError("bad request", 400, BFF_ERROR_CODES.BAD_REQUEST),
		);
		expect(normalized.body.code).toBe(BFF_ERROR_CODES.BAD_REQUEST);
		expect(normalized.status).toBe(400);

		const fallback = toErrorResponseBody(new Error("generic error"));
		expect(fallback.body.code).toBe(BFF_ERROR_CODES.UNKNOWN);
		expect(fallback.status).toBe(500);
	});
});
