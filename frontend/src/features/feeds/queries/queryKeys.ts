export const queryKeys = {
	all: ["rss-feeds"] as const,
	lists: () => [...queryKeys.all, "list"] as const,
	list: () => [...queryKeys.lists()] as const,
	details: () => [...queryKeys.all, "detail"] as const,
	detail: (id: number) => [...queryKeys.details(), id] as const,
};
