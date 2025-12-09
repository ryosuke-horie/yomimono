import type { NextRequest } from "next/server";
import {
	assertLabelName,
	parseBookmarkId,
} from "@/app/api/bookmarks/route-utils";
import { fetchFromApi } from "@/lib/bff/client";
import { BFF_ERROR_CODES, BffError } from "@/lib/bff/errors";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { AssignLabelResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const bookmarkId = parseBookmarkId(id);

		let requestBody: unknown;
		try {
			requestBody = await request.json();
		} catch (error) {
			throw new BffError(
				"リクエストボディの解析に失敗しました。",
				400,
				BFF_ERROR_CODES.BAD_REQUEST,
				error,
			);
		}

		const labelName = assertLabelName(requestBody);
		const { data, status } = await fetchFromApi<AssignLabelResponse>(
			`/api/bookmarks/${bookmarkId}/label`,
			{
				method: "PUT",
				body: { labelName },
			},
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
