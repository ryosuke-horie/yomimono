import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateRSSFeedDTO } from "../types";
import { feedsApi } from "./api";
import { queryKeys } from "./queryKeys";

export const useRSSFeeds = () => {
	return useQuery({
		queryKey: queryKeys.list(),
		queryFn: feedsApi.getFeeds,
	});
};

export const useUpdateRSSFeed = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateRSSFeedDTO }) =>
			feedsApi.updateFeed(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.list() });
		},
	});
};

export const useDeleteRSSFeed = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => feedsApi.deleteFeed(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.list() });
		},
	});
};
