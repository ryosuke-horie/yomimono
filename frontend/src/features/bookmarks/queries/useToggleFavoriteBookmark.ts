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
			// isCurrentlyFavorite の値に基づいて、追加または削除のAPI関数を呼び出す
			isCurrentlyFavorite
				? removeBookmarkFromFavorites(id)
				: addBookmarkToFavorites(id),

		// --- 楽観的更新 ---
		onMutate: async ({ id, isCurrentlyFavorite }: ToggleFavoriteVariables) => {
			const newIsFavorite = !isCurrentlyFavorite;

			// 関連する可能性のあるクエリ (未読リストとお気に入りリスト) をキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.lists() });

			// ロールバック用に現在の未読リストキャッシュを保存
			const previousUnreadData = queryClient.getQueryData<BookmarksData>(
				bookmarkKeys.list("unread"),
			);
			// 未読リストキャッシュを即時更新 (isFavorite を反転)
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

			// ロールバック用にお気に入りリストキャッシュを保存
			const previousFavoriteData = queryClient.getQueryData<Bookmark[]>(
				bookmarkKeys.list("favorites"),
			);
			// お気に入りリストキャッシュを即時更新
			if (previousFavoriteData) {
				queryClient.setQueryData<Bookmark[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData) => {
						if (!oldData) return undefined;
						if (newIsFavorite) {
							// お気に入りに追加する場合:
							// 未読リストのキャッシュから該当ブックマークを探す (存在する場合)
							const bookmarkToAdd = previousUnreadData?.bookmarks.find(
								(b) => b.id === id,
							);
							// 見つからない、または既にお気に入りリストに追加済みの場合は何もしない
							if (!bookmarkToAdd || oldData.some((b) => b.id === id)) {
								return oldData;
							}
							// お気に入りリストに追加
							return [...oldData, { ...bookmarkToAdd, isFavorite: true }];
						}
						// お気に入りから削除する場合: 該当ブックマークをリストから除外
						return oldData.filter((bookmark) => bookmark.id !== id);
					},
				);
			}

			// ロールバック用に両方のスナップショットをコンテキストとして返す
			return { previousUnreadData, previousFavoriteData };
		},

		// エラー発生時の処理
		onError: (err, variables, context) => {
			console.error(
				`Failed to toggle favorite for bookmark ${variables.id}:`,
				err,
			);
			// 保存しておいたデータで両方のキャッシュを元に戻す (ロールバック)
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
			// TODO: ユーザーへのエラー通知を実装 (例: react-hot-toast)
		},

		// 成功/失敗に関わらず実行される処理
		onSettled: () => {
			// 関連クエリを無効化し、サーバーと再同期
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("unread") });
			queryClient.invalidateQueries({
				queryKey: bookmarkKeys.list("favorites"),
			});
		},
	});
};
