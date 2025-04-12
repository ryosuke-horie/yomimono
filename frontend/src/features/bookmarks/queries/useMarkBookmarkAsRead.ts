import type { Bookmark } from "@/features/bookmarks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markBookmarkAsRead } from "./api";
import type { BookmarksData } from "./api"; // getUnreadBookmarks の戻り値型
import { bookmarkKeys } from "./queryKeys";

export const useMarkBookmarkAsRead = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markBookmarkAsRead, // APIリクエスト関数
		onMutate: async (bookmarkId: number) => {
			// 1. 関連クエリのキャンセル (楽観的更新が上書きされないように)
			await queryClient.cancelQueries({
				queryKey: bookmarkKeys.list("unread"),
			});

			// 2. 現在のキャッシュデータのスナップショット取得
			const previousData = queryClient.getQueryData<BookmarksData>(
				bookmarkKeys.list("unread"),
			);

			// 3. キャッシュの楽観的更新
			if (previousData) {
				queryClient.setQueryData<BookmarksData | undefined>(
					// undefined の可能性を考慮
					bookmarkKeys.list("unread"),
					(oldData: BookmarksData | undefined) => {
						// 型を追加
						if (!oldData) return undefined; // oldDataがない場合は何もしない
						return {
							...oldData,
							// bookmarks配列から該当IDを見つけてisReadをtrueにする
							bookmarks: oldData.bookmarks.map(
								(
									bookmark: Bookmark, // 型を追加
								) =>
									bookmark.id === bookmarkId
										? { ...bookmark, isRead: true }
										: bookmark,
							),
							// 必要であれば totalUnread や todayReadCount も楽観的に更新
							// totalUnread: oldData.totalUnread - 1,
							// todayReadCount: oldData.todayReadCount + 1,
							// ※ 正確なカウントは invalidate 後にサーバーから取得される
						};
					},
				);
			}

			// 4. ロールバック用にスナップショットを返す
			return { previousData };
		},
		// 5. エラー発生時のロールバック
		onError: (err, bookmarkId, context) => {
			console.error("Failed to mark as read:", err);
			// onMutateから返されたスナップショットでキャッシュを元に戻す
			if (context?.previousData) {
				queryClient.setQueryData(
					bookmarkKeys.list("unread"),
					context.previousData,
				);
			}
			// TODO: ユーザーへのエラー通知 (例: トースト表示)
		},
		// 6. 成功/失敗に関わらず、最終的にサーバーと同期
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("unread") });
			// 必要であれば関連する他のクエリも無効化する
			// queryClient.invalidateQueries({ queryKey: bookmarkKeys.list("recent") });
		},
	});
};
