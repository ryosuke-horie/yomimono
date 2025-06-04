/**
 * ブックマークを既読にするフック
 * 楽観的更新により、サーバーへのリクエスト前にキャッシュを即座に更新する
 */
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
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
			// 進行中の関連クエリをすべてキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });

			// ロールバック用に現在のキャッシュデータを保存
			const previousUnreadData = queryClient.getQueryData<BookmarksData>(
				bookmarkKeys.list("unread"),
			);
			const previousFavoriteData = queryClient.getQueryData<
				BookmarkWithLabel[]
			>(bookmarkKeys.list("favorites"));
			const previousRecentData = queryClient.getQueryData<{
				[date: string]: BookmarkWithLabel[];
			}>(bookmarkKeys.list("recent"));

			// 未読リストから該当のブックマークを検索して取得
			const bookmarkToUpdate = previousUnreadData?.bookmarks.find(
				(bookmark) => bookmark.id === bookmarkId,
			);

			// キャッシュを即時更新 (isRead を true に)
			if (previousUnreadData) {
				queryClient.setQueryData<BookmarksData | undefined>(
					bookmarkKeys.list("unread"),
					(oldData) => {
						if (!oldData) return undefined;
						return {
							...oldData,
							bookmarks: oldData.bookmarks.filter(
								(bookmark) => bookmark.id !== bookmarkId,
							),
							totalUnread:
								oldData.totalUnread > 0 ? oldData.totalUnread - 1 : 0,
							todayReadCount: oldData.todayReadCount + 1,
						};
					},
				);
			}

			// お気に入りリストのキャッシュも更新
			if (previousFavoriteData) {
				queryClient.setQueryData<BookmarkWithLabel[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData) => {
						if (!oldData) return undefined;
						return oldData.map((bookmark) =>
							bookmark.id === bookmarkId
								? { ...bookmark, isRead: true }
								: bookmark,
						);
					},
				);
			}

			// 最近読んだ記事リストに追加
			if (previousRecentData && bookmarkToUpdate) {
				queryClient.setQueryData<
					| {
							[date: string]: BookmarkWithLabel[];
					  }
					| undefined
				>(bookmarkKeys.list("recent"), (oldData) => {
					if (!oldData) return undefined;

					// 今日の日付を取得
					const today = new Date().toLocaleDateString("ja-JP");
					const newData = { ...oldData };

					// 今日の日付のエントリがなければ作成
					if (!newData[today]) {
						newData[today] = [];
					}

					// ブックマークが既にリストにないことを確認してから追加
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

			// ロールバック用データをコンテキストとして返す
			return {
				previousUnreadData,
				previousFavoriteData,
				previousRecentData,
				bookmarkToUpdate,
			};
		},
		// エラー発生時の処理
		onError: (err, bookmarkId, context) => {
			console.error(`Failed to mark bookmark ${bookmarkId} as read:`, err);
			// 保存しておいたデータでキャッシュを元に戻す (ロールバック)
			if (context?.previousUnreadData) {
				queryClient.setQueryData(
					bookmarkKeys.list("unread"),
					context.previousUnreadData,
				);
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("useMarkBookmarkAsRead", () => {
		it("markBookmarkAsRead関数がインポートされている", () => {
			expect(markBookmarkAsRead).toBeDefined();
			expect(typeof markBookmarkAsRead).toBe("function");
		});

		it("bookmarkKeysがインポートされている", () => {
			expect(bookmarkKeys).toBeDefined();
			expect(bookmarkKeys.all).toBeDefined();
		});

		it("useMarkBookmarkAsRead関数が定義されている", () => {
			expect(useMarkBookmarkAsRead).toBeDefined();
			expect(typeof useMarkBookmarkAsRead).toBe("function");
		});
	});
}
