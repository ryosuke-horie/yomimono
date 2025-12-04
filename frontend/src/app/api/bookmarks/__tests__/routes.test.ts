import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PUT as putLabel } from "@/app/api/bookmarks/[id]/label/route";
import { PATCH as patchRead } from "@/app/api/bookmarks/[id]/read/route";
import { GET as getBookmarks } from "@/app/api/bookmarks/route";
import { fetchFromApi } from "@/lib/bff/client";
import { BFF_ERROR_CODES } from "@/lib/bff/errors";
import type {
	BookmarkListResponse,
	SuccessResponse,
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

	it("PATCH /api/bookmarks/[id]/read をBFF経由で呼び出す", async () => {
		mockedFetchFromApi.mockResolvedValueOnce({
			data: { success: true } satisfies SuccessResponse,
			status: 200,
			headers: new Headers(),
		});

		const response = await patchRead(new Request("http://localhost"), {
			params: { id: "1" },
		});

		expect(mockedFetchFromApi).toHaveBeenCalledWith(
			"/api/bookmarks/1/read",
			expect.objectContaining({ method: "PATCH" }),
		);
		expect(response.status).toBe(200);
	});

	it("PUT /api/bookmarks/[id]/label はlabelNameがない場合400を返す", async () => {
		const response = await putLabel(
			new Request("http://localhost", {
				method: "PUT",
				body: JSON.stringify({}),
			}),
			{ params: { id: "1" } },
		);

		expect(mockedFetchFromApi).not.toHaveBeenCalled();
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			success: false,
			code: BFF_ERROR_CODES.BAD_REQUEST,
		});
	});
});
