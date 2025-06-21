/**
 * MCPサーバーの基本テスト
 */
import { describe, expect, test } from "vitest";
import * as apiClient from "../lib/apiClient.js";

describe("MCP Server Basic Tests", () => {
	test("apiClient should export required functions", () => {
		expect(typeof apiClient.getUnlabeledArticles).toBe("function");
		expect(typeof apiClient.getLabels).toBe("function");
		expect(typeof apiClient.assignLabelToArticle).toBe("function");
		expect(typeof apiClient.createLabel).toBe("function");
		expect(typeof apiClient.getLabelById).toBe("function");
		expect(typeof apiClient.deleteLabel).toBe("function");
		expect(typeof apiClient.updateLabelDescription).toBe("function");
		expect(typeof apiClient.assignLabelsToMultipleArticles).toBe("function");
		expect(typeof apiClient.getBookmarkById).toBe("function");
		expect(typeof apiClient.getUnreadArticlesByLabel).toBe("function");
		expect(typeof apiClient.getUnreadBookmarks).toBe("function");
		expect(typeof apiClient.getReadBookmarks).toBe("function");
		expect(typeof apiClient.markBookmarkAsRead).toBe("function");
	});
});
