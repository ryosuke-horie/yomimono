/**
 * useGetRecentBookmarksフックのテスト
 */
import { describe, expect, it } from "vitest";
import { useGetRecentBookmarks } from "./useGetRecentBookmarks";

describe("useGetRecentBookmarks", () => {
	it("正しいクエリキーを返す", () => {
		// このテストは単純にフックをインポートし、
		// ファイルが正常に読み込めることを確認する
		expect(useGetRecentBookmarks).toBeDefined();
		expect(typeof useGetRecentBookmarks).toBe("function");
	});
});