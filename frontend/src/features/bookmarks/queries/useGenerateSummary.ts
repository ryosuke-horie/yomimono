import { API_BASE_URL } from "@/lib/api/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookmarkKeys } from "./queryKeys";

export function useGenerateSummary() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bookmarkId: number) => {
			const response = await fetch(
				`${API_BASE_URL}/api/bookmarks/${bookmarkId}/summary`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						summary: "AI生成された要約", // 実際にはMCPツールからの要約を使用
					}),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate summary");
			}

			return await response.json();
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