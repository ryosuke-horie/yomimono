import { useQuery } from "@tanstack/react-query";
import { getFavoriteBookmarks } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useGetFavoriteBookmarks = () => {
	return useQuery({
		queryKey: bookmarkKeys.list("favorites"), // クエリキーを設定
		queryFn: getFavoriteBookmarks, // APIリクエスト関数
	});
};
