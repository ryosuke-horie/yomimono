/**
 * ブックマークを未読にするカスタムフック
 * 楽観的更新で複数のキャッシュを即座に更新
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
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const { renderHook, act } = await import("@testing-library/react");
	const { vi, describe, it, expect, beforeEach } = import.meta.vitest;
	const React = await import("react");
	type ReactNode = React.ReactNode;

	// markBookmarkAsUnread APIのモック
	vi.mock("./api", () => ({
		markBookmarkAsUnread: vi.fn(),
	}));

	const createTestWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: 0,
					gcTime: 0,
				},
				mutations: {
					retry: false,
				},
			},
		});

		return ({ children }: { children: ReactNode }) => {
			return React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
		};
	};

	describe("useMarkBookmarkAsUnread", () => {
		let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

		beforeEach(() => {
			wrapper = createTestWrapper();
			vi.clearAllMocks();
		});

		it("未読マークのmutationが正しく初期化される", () => {
			const { result } = renderHook(() => useMarkBookmarkAsUnread(), {
				wrapper,
			});

			expect(result.current.mutate).toBeDefined();
			expect(result.current.mutateAsync).toBeDefined();
			expect(result.current.isPending).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.isSuccess).toBe(false);
		});

		it("未読マーク実行時にローディング状態が正しく管理される", () => {
			const { result } = renderHook(() => useMarkBookmarkAsUnread(), {
				wrapper,
			});

			expect(result.current.isPending).toBe(false);

			act(() => {
				result.current.mutate(1);
			});

			expect(result.current.isPending).toBe(true);
		});

		it("未読マーク成功時にAPIが正しく呼ばれる", async () => {
			const { markBookmarkAsUnread } = await import("./api");
			vi.mocked(markBookmarkAsUnread).mockResolvedValue({ success: true });

			const { result } = renderHook(() => useMarkBookmarkAsUnread(), {
				wrapper,
			});

			await act(async () => {
				result.current.mutate(456);
			});

			expect(markBookmarkAsUnread).toHaveBeenCalledWith(456);
		});
	});
}
