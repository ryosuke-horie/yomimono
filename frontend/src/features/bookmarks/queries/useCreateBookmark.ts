import {
	type InvalidateQueryFilters,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createBookmark } from "./api";
import { bookmarkQueryKeys } from "./queryKeys";

export const useCreateBookmark = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBookmark,
		onSuccess: () => {
			// ブックマーク一覧を無効化して再取得
			queryClient.invalidateQueries(
				bookmarkQueryKeys.all as InvalidateQueryFilters,
			);
		},
	});
};
