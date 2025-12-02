import { describe, expect, test, vi } from "vitest";
import { fetchFromApi } from "../client";
import { BFF_ERROR_CODES, BffError } from "../errors";

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_ENV = { ...process.env };

describe("client", () => {
	afterEach(() => {
		global.fetch = ORIGINAL_FETCH;
		process.env = { ...ORIGINAL_ENV };
		vi.restoreAllMocks();
	});

	test("環境変数のベースURLとAPIキーを使ってfetchする", async () => {
		process.env.BFF_API_BASE_URL = "https://upstream.example.com";
		process.env.BFF_API_KEY = "secret";

		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
			}),
		);

		global.fetch = mockFetch as unknown as typeof fetch;

		const result = await fetchFromApi<{ ok: boolean }>("/api/bookmarks");

		expect(result.data).toEqual({ ok: true });
		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://upstream.example.com/api/bookmarks",
			expect.objectContaining({
				headers: expect.any(Headers),
			}),
		);

		const headers = (mockFetch.mock.calls[0]?.[1]?.headers ?? {}) as Headers;
		expect(headers.get("x-api-key")).toBe("secret");
		expect(headers.get("Cache-Control")).toBeNull();
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
