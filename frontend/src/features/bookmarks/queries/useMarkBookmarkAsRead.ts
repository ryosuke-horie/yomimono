/**
 * ブックマークを既読にするフック
 * 楽観的更新により、サーバーへのリクエスト前にキャッシュを即座に更新する
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import type { QueryToastOptions } from "@/types/toast";
import type { BookmarksData } from "./api";
import { markBookmarkAsRead } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useMarkBookmarkAsRead = (options?: QueryToastOptions) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markBookmarkAsRead,
		// --- 楽観的更新 ---
		onMutate: async (bookmarkId: number) => {
			// 進行中の関連クエリをすべてキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });

			const previousUnreadEntries = queryClient.getQueriesData<BookmarksData>({
				queryKey: bookmarkKeys.list("unread"),
			});
			const previousFavoriteData = queryClient.getQueryData<
				BookmarkWithLabel[]
			>(bookmarkKeys.list("favorites"));
			const previousRecentData = queryClient.getQueryData<{
				[date: string]: BookmarkWithLabel[];
			}>(bookmarkKeys.list("recent"));

			const bookmarkToUpdate =
				previousUnreadEntries
					.map(([, data]) =>
						data?.bookmarks.find((bookmark) => bookmark.id === bookmarkId),
					)
					.find(Boolean) ??
				previousFavoriteData?.find((bookmark) => bookmark.id === bookmarkId);

			queryClient.setQueriesData<BookmarksData | undefined>(
				{ queryKey: bookmarkKeys.list("unread") },
				(oldData) => {
					if (!oldData) return oldData;
					const totalUnread = oldData.totalUnread ?? 0;
					const todayReadCount = oldData.todayReadCount ?? 0;
					return {
						...oldData,
						bookmarks: oldData.bookmarks.filter(
							(bookmark) => bookmark.id !== bookmarkId,
						),
						totalUnread: totalUnread > 0 ? totalUnread - 1 : 0,
						todayReadCount: todayReadCount + 1,
					};
				},
			);

			if (previousFavoriteData) {
				queryClient.setQueryData<BookmarkWithLabel[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData) => {
						if (!oldData) return oldData;
						return oldData.map((bookmark) =>
							bookmark.id === bookmarkId
								? { ...bookmark, isRead: true }
								: bookmark,
						);
					},
				);
			}

			if (previousRecentData && bookmarkToUpdate) {
				queryClient.setQueryData<
					| {
							[date: string]: BookmarkWithLabel[];
					  }
					| undefined
				>(bookmarkKeys.list("recent"), (oldData) => {
					if (!oldData) return oldData;

					const today = new Date().toLocaleDateString("ja-JP");
					const newData = { ...oldData };

					if (!newData[today]) {
						newData[today] = [];
					}

					const bookmarkExists = newData[today].some(
						(bookmark) => bookmark.id === bookmarkId,
					);

					if (!bookmarkExists) {
						const bookmarkWithLabel: BookmarkWithLabel = {
							...bookmarkToUpdate,
							isRead: true,
							label: null,
						};

						newData[today] = [bookmarkWithLabel, ...newData[today]];
					}

					return newData;
				});
			}

			return {
				previousUnreadEntries,
				previousFavoriteData,
				previousRecentData,
				bookmarkToUpdate,
			};
		},
		// エラー発生時の処理
		onError: (_err, _bookmarkId, context) => {
			// Toastでエラーを通知
			if (options?.showToast) {
				options.showToast({
					type: "error",
					message: "既読にできませんでした",
					duration: 3000,
				});
			}
			if (context?.previousUnreadEntries) {
				context.previousUnreadEntries.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
			if (context?.previousFavoriteData) {
				queryClient.setQueryData(
					bookmarkKeys.list("favorites"),
					context.previousFavoriteData,
				);
			}
			if (context?.previousRecentData) {
				queryClient.setQueryData(
					bookmarkKeys.list("recent"),
					context.previousRecentData,
				);
			}
		},
		// 成功/失敗に関わらず実行される処理
		onSettled: () => {
			// 関連クエリを無効化し、サーバーと再同期
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
		},
	});
};
