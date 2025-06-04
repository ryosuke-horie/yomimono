/**
 * 評価一覧取得のカスタムフック
 */
import { useQuery } from "@tanstack/react-query";
import type { RatingFilters } from "../types";
import { fetchRatings } from "./api";
import { ratingQueryKeys } from "./queryKeys";

export const useRatings = (filters?: RatingFilters) => {
	return useQuery({
		queryKey: ratingQueryKeys.list(filters),
		queryFn: () => fetchRatings(filters),
		staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
	});
};
