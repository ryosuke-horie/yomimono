import { useQuery } from "@tanstack/react-query";
import { getRecentlyReadBookmarks } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useGetRecentBookmarks = () => {
	return useQuery({
		queryKey: bookmarkKeys.list("recent"), // クエリキーを設定
		queryFn: getRecentlyReadBookmarks, // APIリクエスト関数
	});
};
