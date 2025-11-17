export const labelKeys = {
	all: ["labels"] as const,
	lists: () => [...labelKeys.all, "list"] as const,
	list: (filters: string) => [...labelKeys.lists(), { filters }] as const,
	details: () => [...labelKeys.all, "detail"] as const,
	detail: (id: number) => [...labelKeys.details(), id] as const,
};
