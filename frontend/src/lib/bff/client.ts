import "server-only";

import type { ErrorResponse } from "@/lib/openapi/server/schemas";
import { getUpstreamApiBaseUrl, getUpstreamApiKey } from "./config";
import {
	BFF_ERROR_CODES,
	BffError,
	createInvalidResponseError,
	normalizeStatusCode,
	normalizeUpstreamError,
} from "./errors";

type BodyInitValue = BodyInit | Record<string, unknown> | null | undefined;

interface BffRequestInit extends Omit<RequestInit, "body"> {
	revalidateSeconds?: number;
	body?: BodyInitValue;
}

export interface BffFetchResult<T> {
	data: T;
	status: number;
	headers: Headers;
}

function buildUrl(path: string): string {
	return new URL(path, getUpstreamApiBaseUrl()).toString();
}

function mergeHeaders(body: BodyInitValue, headers?: HeadersInit): Headers {
	const merged = new Headers(headers);
	merged.set("Accept", "application/json");

	if (body && !merged.has("Content-Type") && typeof body !== "string") {
		merged.set("Content-Type", "application/json");
	}

	const apiKey = getUpstreamApiKey();
	if (apiKey && !merged.has("x-api-key")) {
		merged.set("x-api-key", apiKey);
	}

	return merged;
}

async function parseJsonSafely(bodyText: string): Promise<unknown> {
	if (!bodyText) return null;

	return JSON.parse(bodyText);
}

export async function fetchFromApi<TSuccess, TError = ErrorResponse>(
	path: string,
	{ revalidateSeconds, body, headers, ...init }: BffRequestInit = {},
): Promise<BffFetchResult<TSuccess>> {
	const url = buildUrl(path);
	const mergedHeaders = mergeHeaders(body, headers);

	let serializedBody: BodyInit | undefined;

	if (body !== undefined && body !== null) {
		serializedBody =
			typeof body === "string" || body instanceof Blob
				? body
				: JSON.stringify(body);
	}

	const requestInit: RequestInit = {
		method: init.method ?? "GET",
		cache: init.cache ?? "no-store",
		headers: mergedHeaders,
		body: serializedBody,
		...init,
	};

	if (revalidateSeconds !== undefined) {
		requestInit.next = { revalidate: revalidateSeconds };
	}

	let response: Response;

	try {
		response = await fetch(url, requestInit);
	} catch (error) {
		throw new BffError(
			"ネットワークまたはDNSエラーが発生しました。",
			502,
			BFF_ERROR_CODES.UPSTREAM_ERROR,
			error,
		);
	}

	const responseText = await response.text();
	let parsedBody: unknown = null;

	try {
		parsedBody = await parseJsonSafely(responseText);
	} catch (error) {
		throw createInvalidResponseError(response.status || 502, {
			cause: error,
			responseText,
		});
	}

	if (!response.ok) {
		throw normalizeUpstreamError({
			status: response.status,
			body: (parsedBody as TError) ?? null,
		});
	}

	return {
		data: parsedBody as TSuccess,
		status: normalizeStatusCode(response.status),
		headers: response.headers,
	};
}
