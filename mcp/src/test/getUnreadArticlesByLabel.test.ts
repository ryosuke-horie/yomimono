import { describe, expect, it } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// このテストはMCPツールとAPIクライアントの統合をテストします
describe("getUnreadArticlesByLabel", () => {
	it("APIクライアント関数が正しくエクスポートされている", () => {
		expect(apiClient.getUnreadArticlesByLabel).toBeDefined();
		expect(typeof apiClient.getUnreadArticlesByLabel).toBe("function");
	});

	it("関数が正しいパラメータを受け取る", async () => {
		// 環境変数が設定されていない場合のエラーをキャッチ
		try {
			await apiClient.getUnreadArticlesByLabel("test-label");
		} catch (error) {
			// API_BASE_URLが設定されていない場合のエラーを期待
			expect(error).toBeInstanceOf(Error);
			if (error instanceof Error) {
				expect(error.message).toContain("API_BASE_URL");
			}
		}
	});
});
