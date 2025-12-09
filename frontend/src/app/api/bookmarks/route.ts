import { fetchFromApi } from "@/lib/bff/client";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { BookmarkListResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

function buildPath(request: Request): string {
	const url = new URL(request.url);
	const label = url.searchParams.get("label");
	return label
		? `/api/bookmarks?label=${encodeURIComponent(label)}`
		: "/api/bookmarks";
}

export async function GET(request: Request): Promise<Response> {
	try {
		const path = buildPath(request);
		const { data, status } = await fetchFromApi<BookmarkListResponse>(path);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
