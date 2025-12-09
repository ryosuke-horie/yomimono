/**
 * ブックマークを未読にするフック
 * 楽観的更新により、サーバーへのリクエスト前にキャッシュを即座に更新する
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import type { QueryToastOptions } from "@/types/toast";
import type { BookmarksData } from "./api";
import { markBookmarkAsUnread } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useMarkBookmarkAsUnread = (options?: QueryToastOptions) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markBookmarkAsUnread,
		// --- 楽観的更新 ---
		onMutate: async (bookmarkId: number) => {
			// 進行中の関連クエリをすべてキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });

			// ロールバック用に現在のキャッシュデータを保存
			const previousUnreadEntries = queryClient.getQueriesData<BookmarksData>({
				queryKey: bookmarkKeys.list("unread"),
			});
			const previousFavoriteData = queryClient.getQueryData<
				BookmarkWithLabel[]
			>(bookmarkKeys.list("favorites"));
			const previousRecentData = queryClient.getQueryData<{
				[date: string]: BookmarkWithLabel[];
			}>(bookmarkKeys.list("recent"));

			// 既読リストから該当のブックマークを検索
			let bookmarkToUpdate: BookmarkWithLabel | undefined;

			if (previousRecentData) {
				// 日付ごとにグループ化されたデータから該当ブックマークを探す
				for (const bookmarks of Object.values(previousRecentData)) {
					const found = bookmarks.find(
						(bookmark) => bookmark.id === bookmarkId,
					);
					if (found) {
						bookmarkToUpdate = found;
					}
				}
			}

			if (!bookmarkToUpdate) {
				bookmarkToUpdate = previousFavoriteData?.find(
					(bookmark) => bookmark.id === bookmarkId,
				);
			}

			// 最近読んだリストから該当のブックマークを削除
			if (previousRecentData && bookmarkToUpdate) {
				queryClient.setQueryData<
					| {
							[date: string]: BookmarkWithLabel[];
					  }
					| undefined
				>(bookmarkKeys.list("recent"), (oldData) => {
					if (!oldData) return undefined;

					const newData = { ...oldData };

					// すべての日付のエントリをチェックして、該当するブックマークを削除
					for (const date of Object.keys(newData)) {
						newData[date] = newData[date].filter(
							(bookmark) => bookmark.id !== bookmarkId,
						);
						// 空の配列になった場合は、日付エントリ自体を削除
						if (newData[date].length === 0) {
							delete newData[date];
						}
					}

					return newData;
				});
			}

			// お気に入りリストのキャッシュも更新
			if (previousFavoriteData) {
				queryClient.setQueryData<BookmarkWithLabel[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData) => {
						if (!oldData) return undefined;
						return oldData.map((bookmark) =>
							bookmark.id === bookmarkId
								? { ...bookmark, isRead: false }
								: bookmark,
						);
					},
				);
			}

			// 未読リストに追加
			if (bookmarkToUpdate) {
				const getFilterLabel = (queryKey: readonly unknown[]) => {
					const lastEntry = queryKey.at(-1);
					if (
						lastEntry &&
						typeof lastEntry === "object" &&
						"label" in lastEntry
					) {
						return (lastEntry as { label?: string | null }).label ?? null;
					}
					return null;
				};

				previousUnreadEntries.forEach(([queryKey]) => {
					queryClient.setQueryData<BookmarksData | undefined>(
						queryKey,
						(oldData) => {
							if (!oldData) return oldData;

							const filterLabel = getFilterLabel(queryKey);
							if (
								filterLabel &&
								bookmarkToUpdate?.label?.name !== filterLabel
							) {
								return oldData;
							}

							if (
								oldData.bookmarks.some((bookmark) => bookmark.id === bookmarkId)
							) {
								return oldData;
							}

							const updatedBookmark: BookmarkWithLabel = {
								...bookmarkToUpdate,
								isRead: false,
							};
							const totalUnread = oldData.totalUnread ?? 0;
							const todayReadCount = oldData.todayReadCount ?? 0;

							return {
								...oldData,
								bookmarks: [updatedBookmark, ...oldData.bookmarks],
								totalUnread: totalUnread + 1,
								todayReadCount: todayReadCount > 0 ? todayReadCount - 1 : 0,
							};
						},
					);
				});
			}

			// ロールバック用データをコンテキストとして返す
			return {
				previousUnreadEntries,
				previousFavoriteData,
				previousRecentData,
				bookmarkToUpdate,
			};
		},
		// 成功時の処理
		onSuccess: () => {
			// Toastで成功を通知
			if (options?.showToast) {
				options.showToast({
					type: "success",
					message: "未読に戻しました",
					duration: 2000,
				});
			}
		},
		// エラー発生時の処理
		onError: (_err, _bookmarkId, context) => {
			// Toastでエラーを通知
			if (options?.showToast) {
				options.showToast({
					type: "error",
					message: "未読に戻せませんでした",
					duration: 3000,
				});
			}
			// 保存しておいたデータでキャッシュを元に戻す (ロールバック)
			if (context?.previousUnreadEntries) {
				context.previousUnreadEntries.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
			// お気に入りリストのキャッシュもロールバック
			if (context?.previousFavoriteData) {
				queryClient.setQueryData(
					bookmarkKeys.list("favorites"),
					context.previousFavoriteData,
				);
			}
			// 最近読んだ記事リストのキャッシュもロールバック
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
