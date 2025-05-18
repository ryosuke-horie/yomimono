import { useQuery } from "@tanstack/react-query";
import { feedsApi } from "./api";
import { queryKeys } from "./queryKeys";

export const useRSSFeeds = () => {
	return useQuery({
		queryKey: queryKeys.list(),
		queryFn: feedsApi.getFeeds,
	});
};
