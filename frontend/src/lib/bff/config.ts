import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface CacheControlPolicy {
	maxAge?: number;
	staleWhileRevalidate?: number;
	visibility?: "public" | "private";
	mustRevalidate?: boolean;
}

const DEFAULT_API_BASE_URL =
	"https://effective-yomimono-api.ryosuke-horie37.workers.dev";

export function getUpstreamApiBaseUrl(): string {
	let envUrl: string | undefined;
	try {
		envUrl = getCloudflareContext().env.BFF_API_BASE_URL as string;
	} catch (_e) {
		// Ignore error if context is not available (e.g. build time)
	}

	return (
		envUrl ??
		process.env.BFF_API_BASE_URL ??
		process.env.NEXT_PUBLIC_API_BASE_URL ??
		DEFAULT_API_BASE_URL
	);
}

export function getUpstreamApiKey(): string | undefined {
	let apiKey: string | undefined;
	try {
		apiKey = getCloudflareContext().env.BFF_API_KEY as string;
	} catch (_e) {
		// Ignore error
	}
	return apiKey ?? process.env.BFF_API_KEY;
}

export function buildCacheControl(policy: CacheControlPolicy = {}): string {
	const visibility = policy.visibility ?? "private";
	const directives: string[] = [visibility];
	const maxAge = policy.maxAge ?? 0;

	directives.push(`max-age=${maxAge}`);

	if (policy.staleWhileRevalidate !== undefined) {
		directives.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
	}

	if (policy.mustRevalidate ?? true) {
		directives.push("must-revalidate");
	}

	return directives.join(", ");
}
