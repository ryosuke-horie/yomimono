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
        bookmarkKeys.list("unread")
      );
      const previousReadData = queryClient.getQueryData<BookmarkWithLabel[]>(
        bookmarkKeys.list("read")
      );
      const previousRecentData = queryClient.getQueryData<{
        [date: string]: BookmarkWithLabel[];
      }>(bookmarkKeys.list("recent"));

      // 既読リストから該当のブックマークを検索して取得
      const bookmarkToUpdate = previousReadData?.find(
        (bookmark) => bookmark.id === bookmarkId
      );

      if (bookmarkToUpdate) {
        // 未読リストに追加
        if (previousUnreadData) {
          queryClient.setQueryData<BookmarksData>(
            bookmarkKeys.list("unread"),
            (oldData) => {
              if (!oldData) return undefined;
              return {
                ...oldData,
                bookmarks: [
                  { ...bookmarkToUpdate, isRead: false },
                  ...oldData.bookmarks,
                ],
                totalUnread: oldData.totalUnread + 1,
              };
            }
          );
        }

        // 既読リストから削除
        if (previousReadData) {
          queryClient.setQueryData<BookmarkWithLabel[]>(
            bookmarkKeys.list("read"),
            (oldData) => {
              if (!oldData) return undefined;
              return oldData.filter((bookmark) => bookmark.id !== bookmarkId);
            }
          );
        }

        // 最近読んだリストから削除（オプション）
        if (previousRecentData) {
          queryClient.setQueryData<{
            [date: string]: BookmarkWithLabel[];
          } | undefined>(bookmarkKeys.list("recent"), (oldData) => {
            if (!oldData) return undefined;

            const newData = { ...oldData };
            // すべての日付のエントリをチェック
            for (const date in newData) {
              newData[date] = newData[date].filter(
                (bookmark) => bookmark.id !== bookmarkId
              );
              // 空の日付エントリを削除
              if (newData[date].length === 0) {
                delete newData[date];
              }
            }

            return newData;
          });
        }
      }

      // ロールバック用データをコンテキストとして返す
      return {
        previousUnreadData,
        previousReadData,
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
          context.previousUnreadData
        );
      }
      // 既読リストのキャッシュもロールバック
      if (context?.previousReadData) {
        queryClient.setQueryData(
          bookmarkKeys.list("read"),
          context.previousReadData
        );
      }
      // 最近読んだ記事リストのキャッシュもロールバック
      if (context?.previousRecentData) {
        queryClient.setQueryData(
          bookmarkKeys.list("recent"),
          context.previousRecentData
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