import { apiClient } from "@/lib/api/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookmarkKeys } from "./queryKeys";

export function useGenerateSummary() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bookmarkId: number) => {
			const response = await apiClient.post(
				`/bookmarks/${bookmarkId}/summary`,
				{
					summary: "AI生成された要約", // 実際にはMCPツールからの要約を使用
				},
			);
			return response.data;
		},
		onSuccess: (data, bookmarkId) => {
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
