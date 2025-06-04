/**
 * ブックマークを未読にするフック
 * 楽観的更新により、サーバーへのリクエスト前にキャッシュを即座に更新する
 */
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markBookmarkAsUnread } from "./api";
import type { BookmarksData } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useMarkBookmarkAsUnread = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markBookmarkAsUnread,
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
			if (previousUnreadData && bookmarkToUpdate) {
				queryClient.setQueryData<BookmarksData | undefined>(
					bookmarkKeys.list("unread"),
					(oldData) => {
						if (!oldData) return undefined;

						// 既存の未読リストにブックマークを追加
						const updatedBookmark: BookmarkWithLabel = {
							...bookmarkToUpdate,
							isRead: false,
						};

						return {
							...oldData,
							bookmarks: [updatedBookmark, ...oldData.bookmarks],
							totalUnread: oldData.totalUnread + 1,
							todayReadCount:
								oldData.todayReadCount > 0 ? oldData.todayReadCount - 1 : 0,
						};
					},
				);
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
			console.error(`Failed to mark bookmark ${bookmarkId} as unread:`, err);
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

	describe("useMarkBookmarkAsUnread", () => {
		it("markBookmarkAsUnread関数がインポートされている", () => {
			expect(markBookmarkAsUnread).toBeDefined();
			expect(typeof markBookmarkAsUnread).toBe("function");
		});

		it("bookmarkKeysがインポートされている", () => {
			expect(bookmarkKeys).toBeDefined();
			expect(bookmarkKeys.all).toBeDefined();
		});

		it("useMarkBookmarkAsUnread関数が定義されている", () => {
			expect(useMarkBookmarkAsUnread).toBeDefined();
			expect(typeof useMarkBookmarkAsUnread).toBe("function");
		});
	});
}
