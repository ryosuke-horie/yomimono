import {
	type InvalidateQueryFilters,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createBookmark } from "./api";

export const useCreateBookmark = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBookmark,
		onSuccess: () => {
			// ブックマーク一覧を無効化して再取得（staleTimeを無視して即座に再取得）
			queryClient.invalidateQueries({
				queryKey: ["bookmarks"],
				refetchType: "all",
			} as InvalidateQueryFilters);

			// 追加後すぐに最新データを取得するため
			queryClient.refetchQueries({
				queryKey: ["bookmarks"],
				type: "active",
			});
		},
	});
};
