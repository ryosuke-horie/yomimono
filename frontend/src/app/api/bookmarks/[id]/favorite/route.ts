import type { NextRequest } from "next/server";
import { parseBookmarkId } from "@/app/api/bookmarks/route-utils";
import { fetchFromApi } from "@/lib/bff/client";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { SuccessResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const bookmarkId = parseBookmarkId(id);
		const { data, status } = await fetchFromApi<SuccessResponse>(
			`/api/bookmarks/${bookmarkId}/favorite`,
			{ method: "POST" },
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const bookmarkId = parseBookmarkId(id);
		const { data, status } = await fetchFromApi<SuccessResponse>(
			`/api/bookmarks/${bookmarkId}/favorite`,
			{ method: "DELETE" },
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
