import { expect, test } from "vitest";

import {
	BadRequestError,
	InternalServerError,
	createErrorResponse,
	createErrorResponseBody,
	toContentfulStatusCode,
} from "./index";

test("バレル経由で例外クラスとユーティリティを組み合わせてレスポンスを構築できる", () => {
	const badRequest = new BadRequestError("Invalid payload");
	const errorResponse = createErrorResponse(badRequest);

	expect(errorResponse).toEqual({
		success: false,
		message: "Invalid payload",
		statusCode: 400,
	});

	const internalErrorBody = createErrorResponseBody(
		new InternalServerError("Unexpected failure"),
	);
	expect(internalErrorBody).toEqual({
		success: false,
		message: "Unexpected failure",
	});
});

test("toContentfulStatusCode はバレル経由のエクスポートでも意図通り動作する", () => {
	expect(toContentfulStatusCode(201)).toBe(201);
	expect(toContentfulStatusCode(404)).toBe(404);
	expect(toContentfulStatusCode(99)).toBe(500);
	expect(toContentfulStatusCode(620)).toBe(500);
});
