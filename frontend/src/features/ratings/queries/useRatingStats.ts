/**
 * 評価統計情報取得のカスタムフック
 */
import { useQuery } from "@tanstack/react-query";
import { fetchRatingStats } from "./api";
import { ratingQueryKeys } from "./queryKeys";

export const useRatingStats = () => {
	return useQuery({
		queryKey: ratingQueryKeys.stats(),
		queryFn: fetchRatingStats,
		staleTime: 10 * 60 * 1000, // 10分間はキャッシュを使用
	});
};
