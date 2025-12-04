import { parseBookmarkId } from "@/app/api/bookmarks/route-utils";
import { fetchFromApi } from "@/lib/bff/client";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { SuccessResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
	_request: Request,
	{ params }: { params: { id: string } },
): Promise<Response> {
	try {
		const bookmarkId = parseBookmarkId(params?.id);
		const { data, status } = await fetchFromApi<SuccessResponse>(
			`/api/bookmarks/${bookmarkId}/unread`,
			{ method: "PATCH" },
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
