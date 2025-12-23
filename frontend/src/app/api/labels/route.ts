import type { NextRequest } from "next/server";
import { fetchFromApi } from "@/lib/bff/client";
import { BFF_ERROR_CODES, BffError } from "@/lib/bff/errors";
import { errorJsonResponse, jsonResponse } from "@/lib/bff/response";
import type { LabelResponse, LabelsResponse } from "@/lib/openapi/server/schemas";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	try {
		const { data, status } = await fetchFromApi<LabelsResponse>("/api/labels");
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	try {
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

		const { data, status } = await fetchFromApi<LabelResponse>("/api/labels", {
			method: "POST",
			body: body ?? {},
		});
		return jsonResponse(data, { status });
	} catch (error) {
		return errorJsonResponse(error);
	}
}
