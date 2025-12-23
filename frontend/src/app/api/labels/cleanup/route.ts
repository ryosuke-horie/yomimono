import { fetchFromApi } from "@/lib/bff/client";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { LabelCleanupResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function DELETE(): Promise<Response> {
	try {
		const { data, status } = await fetchFromApi<LabelCleanupResponse>(
			"/api/labels/cleanup",
			{ method: "DELETE" },
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
