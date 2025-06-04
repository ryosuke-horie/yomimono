/**
 * 記事評価取得のカスタムフック
 */
import { useQuery } from "@tanstack/react-query";
import { fetchArticleRating } from "./api";
import { ratingQueryKeys } from "./queryKeys";

export const useArticleRating = (articleId: number) => {
	return useQuery({
		queryKey: ratingQueryKeys.byArticle(articleId),
		queryFn: () => fetchArticleRating(articleId),
		staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
	});
};
