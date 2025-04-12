import { useQuery } from "@tanstack/react-query";
import { getUnreadBookmarks } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useGetUnreadBookmarks = () => {
	return useQuery({
		queryKey: bookmarkKeys.list("unread"), // クエリキーを設定
		queryFn: getUnreadBookmarks, // APIリクエスト関数
		// staleTime は QueryClient の defaultOptions で設定済みのため、ここでは省略可
		// 必要に応じて個別に設定も可能
	});
};
