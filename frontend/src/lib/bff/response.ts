import "server-only";

import { buildCacheControl, type CacheControlPolicy } from "./config";
import { normalizeStatusCode, toErrorResponseBody } from "./errors";

interface JsonResponseInit {
	status?: number;
	headers?: HeadersInit;
	cachePolicy?: CacheControlPolicy;
}

export function jsonResponse<T>(
	body: T,
	{ status = 200, headers, cachePolicy }: JsonResponseInit = {},
): Response {
	const mergedHeaders = new Headers(headers);
	mergedHeaders.set("Content-Type", "application/json");
	mergedHeaders.set("Cache-Control", buildCacheControl(cachePolicy));

	return new Response(JSON.stringify(body), {
		status: normalizeStatusCode(status),
		headers: mergedHeaders,
	});
}

export function errorJsonResponse(
	error: unknown,
	init?: Omit<JsonResponseInit, "status">,
): Response {
	const normalized = toErrorResponseBody(error);
	return jsonResponse(normalized.body, {
		status: normalized.status,
		headers: init?.headers,
		cachePolicy: init?.cachePolicy,
	});
}
