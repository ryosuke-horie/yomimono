import { describe, expect, it, vi } from "vitest";
import { RSSFetcher } from "../../../src/services/rssFetcher";
describe("RSSFetcher", () => {
	let rssFetcher;
	beforeEach(() => {
		rssFetcher = new RSSFetcher();
	});
	describe("fetchFeed", () => {
		it("正常に RSS フィードを取得できる", async () => {
			// Mock fetch 関数
			const mockResponse = {
				ok: true,
				status: 200,
				text: vi
					.fn()
					.mockResolvedValue(
						'<?xml version="1.0"?><rss><channel></channel></rss>',
					),
			};
			// @ts-ignore
			global.fetch = vi.fn().mockResolvedValue(mockResponse);
			const url = "https://example.com/rss";
			const result = await rssFetcher.fetchFeed(url);
			expect(fetch).toHaveBeenCalledWith(url, {
				headers: {
					"User-Agent": "Yomimono RSS Reader 1.0",
					Accept: "application/rss+xml, application/xml, text/xml",
				},
				cf: {
					cacheEverything: true,
					cacheTtl: 300,
				},
			});
			expect(result).toBe(
				'<?xml version="1.0"?><rss><channel></channel></rss>',
			);
		});
		it("fetch が失敗した場合エラーをスローする", async () => {
			// Mock fetch 関数
			const mockResponse = {
				ok: false,
				status: 404,
			};
			// @ts-ignore
			global.fetch = vi.fn().mockResolvedValue(mockResponse);
			const url = "https://example.com/nonexistent";
			await expect(rssFetcher.fetchFeed(url)).rejects.toThrow(
				"Failed to fetch RSS: 404",
			);
		});
	});
});
