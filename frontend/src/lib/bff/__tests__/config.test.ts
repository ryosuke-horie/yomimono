import { describe, expect, test } from "vitest";

import {
	buildCacheControl,
	DEFAULT_CACHE_CONTROL,
	getUpstreamApiBaseUrl,
	getUpstreamApiKey,
} from "../config";

const ORIGINAL_ENV = { ...process.env };

describe("config", () => {
	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	test("APIベースURLが環境変数から取得できる", () => {
		process.env.BFF_API_BASE_URL = "https://example.com";
		expect(getUpstreamApiBaseUrl()).toBe("https://example.com");
	});

	test("APIキーが環境変数から取得できる", () => {
		process.env.BFF_API_KEY = "secret";
		expect(getUpstreamApiKey()).toBe("secret");
	});

	test("Cache-Controlのデフォルト方針を生成する", () => {
		expect(DEFAULT_CACHE_CONTROL).toBe("private, max-age=0, must-revalidate");
	});

	test("Cache-Controlの各ディレクティブを組み立てられる", () => {
		const value = buildCacheControl({
			maxAge: 60,
			staleWhileRevalidate: 30,
			visibility: "public",
		});
		expect(value).toBe(
			"public, max-age=60, stale-while-revalidate=30, must-revalidate",
		);
	});
});
