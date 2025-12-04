import { describe, expect, test, vi } from "vitest";
import { fetchFromApi } from "../client";
import { BFF_ERROR_CODES, BffError } from "../errors";

const ORIGINAL_FETCH = global.fetch;

describe("client", () => {
	afterEach(() => {
		global.fetch = ORIGINAL_FETCH;
		vi.restoreAllMocks();
	});

	test("HTTPエラーの場合はBffErrorを投げる", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: "not found", success: false }), {
				status: 404,
			}),
		);

		global.fetch = mockFetch as unknown as typeof fetch;

		const request = fetchFromApi("/api/bookmarks");
		await expect(request).rejects.toThrow(BffError);
		await expect(request).rejects.toMatchObject({
			code: BFF_ERROR_CODES.NOT_FOUND,
			status: 404,
		});
	});

	test("JSONをパースできない場合はINVALID_RESPONSEで落とす", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response("not-json", {
				status: 200,
			}),
		);

		global.fetch = mockFetch as unknown as typeof fetch;

		await expect(fetchFromApi("/api/bookmarks")).rejects.toMatchObject({
			code: BFF_ERROR_CODES.INVALID_RESPONSE,
		});
	});
});
