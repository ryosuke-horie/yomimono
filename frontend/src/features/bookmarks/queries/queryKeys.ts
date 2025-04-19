export const bookmarkKeys = {
	all: ["bookmarks"] as const, // ルートキー
	lists: () => [...bookmarkKeys.all, "list"] as const, // リスト系クエリの共通プレフィックス
	list: (type: "unread" | "favorites" | "recent") =>
		[...bookmarkKeys.lists(), { type }] as const, // 各リストのキー
	details: () => [...bookmarkKeys.all, "detail"] as const, // 詳細系クエリの共通プレフィックス
	detail: (id: number) => [...bookmarkKeys.details(), id] as const, // 個別ブックマークのキー
};
