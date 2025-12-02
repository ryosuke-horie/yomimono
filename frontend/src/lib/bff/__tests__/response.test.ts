import { describe, expect, test } from "vitest";

import { BFF_ERROR_CODES, BffError } from "../errors";
import { errorJsonResponse, jsonResponse } from "../response";

describe("response", () => {
	test("JSONレスポンスを作成しCache-Controlを付与する", async () => {
		const response = jsonResponse(
			{ ok: true },
			{ cachePolicy: { maxAge: 120 } },
		);
		expect(response.headers.get("Content-Type")).toBe("application/json");
		expect(response.headers.get("Cache-Control")).toBe(
			"private, max-age=120, must-revalidate",
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
	});

	test("エラーを正規化したJSONレスポンスを返す", async () => {
		const response = errorJsonResponse(
			new BffError("forbidden", 403, BFF_ERROR_CODES.FORBIDDEN),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			success: false,
			message: "forbidden",
			code: BFF_ERROR_CODES.FORBIDDEN,
		});
	});
});
