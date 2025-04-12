import type { Bookmark } from "@/features/bookmarks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBookmarkToFavorites, removeBookmarkFromFavorites } from "./api";
import type { BookmarksData } from "./api";
import { bookmarkKeys } from "./queryKeys";

interface ToggleFavoriteVariables {
	id: number;
	isCurrentlyFavorite: boolean; // 現在の状態を渡して、逆の操作を行う
}

export const useToggleFavoriteBookmark = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, isCurrentlyFavorite }: ToggleFavoriteVariables) =>
			isCurrentlyFavorite
				? removeBookmarkFromFavorites(id)
				: addBookmarkToFavorites(id),

		onMutate: async ({ id, isCurrentlyFavorite }: ToggleFavoriteVariables) => {
			const newIsFavorite = !isCurrentlyFavorite;

			// 関連クエリをキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.lists() }); // お気に入りと未読の両方に影響する可能性

			// --- 未読リストキャッシュの楽観的更新 ---
			const previousUnreadData = queryClient.getQueryData<BookmarksData>(
				bookmarkKeys.list("unread"),
			);
			if (previousUnreadData) {
				queryClient.setQueryData<BookmarksData | undefined>(
					bookmarkKeys.list("unread"),
					(oldData) =>
						oldData
							? {
									...oldData,
									bookmarks: oldData.bookmarks.map((bookmark) =>
										bookmark.id === id
											? { ...bookmark, isFavorite: newIsFavorite }
											: bookmark,
									),
								}
							: undefined,
				);
			}

			// --- お気に入りリストキャッシュの楽観的更新 ---
			const previousFavoriteData = queryClient.getQueryData<Bookmark[]>(
				bookmarkKeys.list("favorites"),
			);
			if (previousFavoriteData) {
				queryClient.setQueryData<Bookmark[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData) => {
						if (!oldData) return undefined;
						if (newIsFavorite) {
							// お気に入りに追加する場合: 未読リストから該当ブックマークを探して追加
							const bookmarkToAdd = previousUnreadData?.bookmarks.find(
								(b) => b.id === id,
							);
							// 見つからない、または既に追加済みの場合は何もしない
							if (!bookmarkToAdd || oldData.some((b) => b.id === id)) {
								return oldData;
							}
							return [...oldData, { ...bookmarkToAdd, isFavorite: true }];
						}
						// お気に入りから削除する場合
						return oldData.filter((bookmark) => bookmark.id !== id);
					},
				);
			}

			// ロールバック用に両方のスナップショットを返す
			return { previousUnreadData, previousFavoriteData };
		},

		onError: (err, variables, context) => {
			console.error("Failed to toggle favorite:", err);
			// 両方のキャッシュをロールバック
			if (context?.previousUnreadData) {
				queryClient.setQueryData(
					bookmarkKeys.list("unread"),
					context.previousUnreadData,
				);
			}
			if (context?.previousFavoriteData) {
				queryClient.setQueryData(
					bookmarkKeys.list("favorites"),
					context.previousFavoriteData,
				);
			}
			// TODO: ユーザーへのエラー通知
		},

		onSettled: () => {
			// 両方のリストキャッシュを無効化して再同期
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("unread") });
			queryClient.invalidateQueries({
				queryKey: bookmarkKeys.list("favorites"),
			});
		},
	});
};
