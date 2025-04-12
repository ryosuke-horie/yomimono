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
			// 進行中のクエリをキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.list("unread") });

			// ロールバック用に現在のキャッシュデータを保存
			const previousData = queryClient.getQueryData<BookmarksData>(
				bookmarkKeys.list("unread"),
			);

			// キャッシュを即時更新 (isRead を true に)
			if (previousData) {
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

			// ロールバック用データをコンテキストとして返す
			return { previousData };
		},
		// エラー発生時の処理
		onError: (err, bookmarkId, context) => {
			console.error(`Failed to mark bookmark ${bookmarkId} as read:`, err);
			// 保存しておいたデータでキャッシュを元に戻す (ロールバック)
			if (context?.previousData) {
				queryClient.setQueryData(
					bookmarkKeys.list("unread"),
					context.previousData,
				);
			}
			// TODO: ユーザーへのエラー通知を実装 (例: react-hot-toast)
		},
		// 成功/失敗に関わらず実行される処理
		onSettled: () => {
			// 関連クエリを無効化し、サーバーと再同期
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("unread") });
			// 必要に応じて他の関連クエリも無効化 (例: 最近読んだリスト)
			// queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("recent") });
		},
	});
};
