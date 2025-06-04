/**
 * ブックマーク関連のクエリキー生成器
 * TanStack Queryのクエリ無効化とキャッシュ管理に使用
 */
export const bookmarkKeys = {
	all: ["bookmarks"] as const, // ルートキー
	lists: () => [...bookmarkKeys.all, "list"] as const, // リスト系クエリの共通プレフィックス
	list: (type: "unread" | "favorites" | "recent") =>
		[...bookmarkKeys.lists(), { type }] as const, // 各リストのキー
	details: () => [...bookmarkKeys.all, "detail"] as const, // 詳細系クエリの共通プレフィックス
	detail: (id: number) => [...bookmarkKeys.details(), id] as const, // 個別ブックマークのキー
};

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("bookmarkKeys", () => {
		it("lists()メソッドが正しく動作する", () => {
			const result = bookmarkKeys.lists();
			expect(result).toEqual(["bookmarks", "list"]);
		});

		it("details()メソッドが正しく動作する", () => {
			const result = bookmarkKeys.details();
			expect(result).toEqual(["bookmarks", "detail"]);
		});

		it("detail()メソッドが正しく動作する", () => {
			const result = bookmarkKeys.detail(123);
			expect(result).toEqual(["bookmarks", "detail", 123]);
		});
	});
}
