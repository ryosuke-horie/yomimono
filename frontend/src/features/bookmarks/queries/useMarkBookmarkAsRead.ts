import type { Bookmark } from "@/features/bookmarks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markBookmarkAsRead } from "./api";
import type { BookmarksData } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useMarkBookmarkAsRead = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markBookmarkAsRead,
		// --- 楽観的更新 ---
		onMutate: async (bookmarkId: number) => {
			// 進行中の関連クエリ (未読とお気に入り) をキャンセル
			await queryClient.cancelQueries({
				queryKey: bookmarkKeys.list("unread"),
			});
			await queryClient.cancelQueries({
				queryKey: bookmarkKeys.list("favorites"),
			});

			// ロールバック用に現在のキャッシュデータを保存
			const previousUnreadData = queryClient.getQueryData<BookmarksData>(
				// 変数名を変更
				bookmarkKeys.list("unread"),
			);
			const previousFavoriteData = queryClient.getQueryData<Bookmark[]>(
				// お気に入りのスナップショット取得を追加
				bookmarkKeys.list("favorites"),
			);

			// キャッシュを即時更新 (isRead を true に)
			if (previousUnreadData) {
				// 変数名を修正
				queryClient.setQueryData<BookmarksData | undefined>(
					bookmarkKeys.list("unread"),
					(oldData: BookmarksData | undefined) => {
						if (!oldData) return undefined;
						return {
							...oldData,
							bookmarks: oldData.bookmarks.map((bookmark: Bookmark) =>
								bookmark.id === bookmarkId
									? { ...bookmark, isRead: true }
									: bookmark,
							),
							// Note: totalUnread や todayReadCount の楽観的更新は省略。
							// invalidateQueries で最終的に同期されるため。
						};
					},
				);
			}

			// お気に入りリストのキャッシュも更新
			if (previousFavoriteData) {
				queryClient.setQueryData<Bookmark[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData: Bookmark[] | undefined) =>
						oldData?.map((bookmark) =>
							bookmark.id === bookmarkId
								? { ...bookmark, isRead: true }
								: bookmark,
						),
				);
			}

			// ロールバック用データをコンテキストとして返す
			return { previousUnreadData, previousFavoriteData }; // 変数名を修正し、お気に入りデータも返す
		},
		// エラー発生時の処理
		onError: (err, bookmarkId, context) => {
			console.error(`Failed to mark bookmark ${bookmarkId} as read:`, err);
			// 保存しておいたデータでキャッシュを元に戻す (ロールバック)
			if (context?.previousUnreadData) {
				// 変数名を修正
				queryClient.setQueryData(
					bookmarkKeys.list("unread"),
					context.previousUnreadData, // 変数名を修正
				);
			}
			// お気に入りリストのキャッシュもロールバック
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
			// お気に入りリストのクエリも無効化
			queryClient.invalidateQueries({
				queryKey: bookmarkKeys.list("favorites"),
			});
			// 最近読んだリストのクエリも無効化
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("recent") });
		},
	});
};
