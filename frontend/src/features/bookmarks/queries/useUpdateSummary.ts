import { apiClient } from "@/lib/api/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookmarkKeys } from "./queryKeys";

export function useUpdateSummary() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			bookmarkId,
			summary,
		}: {
			bookmarkId: number;
			summary: string;
		}) => {
			const response = await apiClient.put(`/bookmarks/${bookmarkId}/summary`, {
				summary,
			});
			return response.data;
		},
		onSuccess: (data, { bookmarkId }) => {
			// 個別のブックマークのクエリを無効化
			queryClient.invalidateQueries({
				queryKey: bookmarkKeys.detail(bookmarkId),
			});
			// リスト系のクエリも無効化
			queryClient.invalidateQueries({
				queryKey: bookmarkKeys.lists(),
			});
		},
	});
}
