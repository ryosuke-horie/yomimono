import type { NextRequest } from "next/server";
import { parseLabelId } from "@/app/api/labels/route-utils";
import { fetchFromApi } from "@/lib/bff/client";
import { BFF_ERROR_CODES, BffError } from "@/lib/bff/errors";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type {
	LabelResponse,
	MessageResponse,
} from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const labelId = parseLabelId(id);
		const { data, status } = await fetchFromApi<LabelResponse>(
			`/api/labels/${labelId}`,
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	try {
		const { id } = await params;
		const labelId = parseLabelId(id);

		let body: Record<string, unknown> | null;

		try {
			body = await request.json();
		} catch (error) {
			throw new BffError(
				"リクエストボディの解析に失敗しました。",
				400,
				BFF_ERROR_CODES.BAD_REQUEST,
				error,
			);
		}

		const { data, status } = await fetchFromApi<LabelResponse>(
			`/api/labels/${labelId}`,
			{
				method: "PATCH",
				body: body ?? {},
			},
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
		const labelId = parseLabelId(id);
		const { data, status } = await fetchFromApi<MessageResponse>(
			`/api/labels/${labelId}`,
			{ method: "DELETE" },
		);
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
