import { fetchFromApi } from "@/lib/bff/client";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { FavoriteBookmarksResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	try {
		const { data, status } = await fetchFromApi<FavoriteBookmarksResponse>(
			"/api/bookmarks/favorites",
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
