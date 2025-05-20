export const queryKeys = {
	all: ["rss-feeds"] as const,
	lists: () => [...queryKeys.all, "list"] as const,
	list: () => [...queryKeys.lists()] as const,
	details: () => [...queryKeys.all, "detail"] as const,
	detail: (id: number) => [...queryKeys.details(), id] as const,
	
	// RSSフィードアイテム関連
	items: {
		all: ["rss-items"] as const,
		lists: () => [...queryKeys.items.all, "list"] as const,
		list: (params: { feedId?: number | null; page?: number }) => 
			[...queryKeys.items.lists(), params] as const,
	},
};
