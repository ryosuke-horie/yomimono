import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getBookmarks } from "@/app/api/bookmarks/route";
import { fetchFromApi } from "@/lib/bff/client";
import type { BookmarkListResponse } from "@/lib/openapi/server/schemas";

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
});
