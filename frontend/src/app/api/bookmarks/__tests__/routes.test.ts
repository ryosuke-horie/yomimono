import type { NextRequest } from "next/server";
import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as postBulk } from "@/app/api/bookmarks/bulk/route";
import { GET as getBookmarks } from "@/app/api/bookmarks/route";
import { fetchFromApi } from "@/lib/bff/client";
import type {
	BookmarkListResponse,
	MessageResponse,
} from "@/lib/openapi/server/schemas";

vi.mock("@/lib/bff/client", () => ({
	fetchFromApi: vi.fn(),
}));

const mockedFetchFromApi = fetchFromApi as unknown as Mock;

afterEach(() => {
	vi.clearAllMocks();
});

describe("bookmarks route handlers", () => {
	it("GET /api/bookmarks はlabelクエリを付与して上流に転送する", async () => {
		const data: BookmarkListResponse = {
			success: true,
			bookmarks: [],
			totalUnread: 0,
			todayReadCount: 0,
		};
		mockedFetchFromApi.mockResolvedValueOnce({
			data,
			status: 200,
			headers: new Headers(),
		});

		const response = await getBookmarks(
			new Request("http://localhost/api/bookmarks?label=tech"),
		);

		expect(mockedFetchFromApi).toHaveBeenCalledWith(
			"/api/bookmarks?label=tech",
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(data);
	});

	it("POST /api/bookmarks/bulk を上流に転送する", async () => {
		const body = { bookmarks: [{ title: "test", url: "https://example.com" }] };
		const data: MessageResponse = { success: true, message: "ok" };

		mockedFetchFromApi.mockResolvedValueOnce({
			data,
			status: 200,
			headers: new Headers(),
		});

		const response = await postBulk(
			new Request("http://localhost/api/bookmarks/bulk", {
				method: "POST",
				body: JSON.stringify(body),
			}) as unknown as NextRequest,
		);

		expect(mockedFetchFromApi).toHaveBeenCalledWith(
			"/api/bookmarks/bulk",
			expect.objectContaining({
				method: "POST",
				body,
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(data);
	});
});
