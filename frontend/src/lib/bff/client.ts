import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
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

interface BffFetchResult<T> {
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
	const mergedHeaders = mergeHeaders(body, headers);
	const cache =
		init.cache ??
		(revalidateSeconds !== undefined ? "force-cache" : "no-store");

	let serializedBody: BodyInit | undefined;

	if (body !== undefined && body !== null) {
		serializedBody =
			typeof body === "string" || body instanceof Blob
				? body
				: JSON.stringify(body);
	}

	const requestInit: RequestInit = {
		method: init.method ?? "GET",
		cache,
		headers: mergedHeaders,
		body: serializedBody,
		...init,
	};

	if (revalidateSeconds !== undefined) {
		requestInit.next = { revalidate: revalidateSeconds };
	}

	let response: Response;

	try {
		let apiBinding: { fetch: typeof fetch } | undefined;
		let envKeys: string[] = [];
		try {
			const env = getCloudflareContext().env;
			envKeys = Object.keys(env);
			apiBinding = env.API as unknown as {
				fetch: typeof fetch;
			};
		} catch (e) {
			console.error("[BFF] Failed to get Cloudflare context:", e);
		}

		console.log(`[BFF] Env keys: ${envKeys.join(", ")}`); // Debug: what do we have?

		if (apiBinding && process.env.NODE_ENV !== "development") {
			// Use Service Binding
			const url = new URL(path, "http://internal");
            console.log(`[BFF] Using Service Binding: ${!!apiBinding}`); // Debug
			response = await apiBinding.fetch(url, requestInit);
		} else {
			// Fallback to public URL (or localhost in dev)
			const url = buildUrl(path);
            console.log(`[BFF] Using Public URL (Fallback): ${url}`); // Debug
			response = await fetch(url, requestInit);
		}
        console.log(`[BFF] Response status: ${response.status}`); // Debug
	} catch (error) {
        console.error("[BFF] Fetch failed:", error); // Debug
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
