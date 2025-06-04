/**
 * 記事評価ポイント機能のReact Query キー定義
 */
import type { RatingFilters } from "../types";

export const ratingQueryKeys = {
	all: ["ratings"] as const,
	lists: () => [...ratingQueryKeys.all, "list"] as const,
	list: (filters?: RatingFilters) =>
		[...ratingQueryKeys.lists(), filters] as const,
	details: () => [...ratingQueryKeys.all, "detail"] as const,
	detail: (id: number) => [...ratingQueryKeys.details(), id] as const,
	stats: () => [...ratingQueryKeys.all, "stats"] as const,
	byArticle: (articleId: number) =>
		[...ratingQueryKeys.all, "article", articleId] as const,
};
