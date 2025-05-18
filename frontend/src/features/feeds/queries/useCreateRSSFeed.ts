import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateRSSFeedDTO } from "../types";
import { feedsApi } from "./api";
import { queryKeys } from "./queryKeys";

export const useCreateRSSFeed = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateRSSFeedDTO) => feedsApi.createFeed(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.list() });
		},
	});
};
