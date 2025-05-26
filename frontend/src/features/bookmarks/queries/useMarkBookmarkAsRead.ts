/**
 * ブックマークを既読にするカスタムフック
 * 楽観的更新で複数のキャッシュを即座に更新
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
	const { QueryClient, QueryClientProvider } = await import(
		"@tanstack/react-query"
	);
	const { renderHook, act } = await import("@testing-library/react");
	const { vi, describe, it, expect, beforeEach } = import.meta.vitest;
	const React = await import("react");
	type ReactNode = React.ReactNode;

	// markBookmarkAsRead APIのモック
	vi.mock("./api", () => ({
		markBookmarkAsRead: vi.fn(),
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

	describe("useMarkBookmarkAsRead", () => {
		let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

		beforeEach(() => {
			wrapper = createTestWrapper();
			vi.clearAllMocks();
		});

		it("既読マークのmutationが正しく初期化される", () => {
			const { result } = renderHook(() => useMarkBookmarkAsRead(), { wrapper });

			expect(result.current.mutate).toBeDefined();
			expect(result.current.mutateAsync).toBeDefined();
			expect(result.current.isPending).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.isSuccess).toBe(false);
		});

		it("既読マーク実行時にローディング状態が正しく管理される", () => {
			const { result } = renderHook(() => useMarkBookmarkAsRead(), { wrapper });

			expect(result.current.isPending).toBe(false);

			act(() => {
				result.current.mutate(1);
			});

			expect(result.current.isPending).toBe(true);
		});

		it("既読マーク成功時にAPIが正しく呼ばれる", async () => {
			const { markBookmarkAsRead } = await import("./api");
			vi.mocked(markBookmarkAsRead).mockResolvedValue({ success: true });

			const { result } = renderHook(() => useMarkBookmarkAsRead(), { wrapper });

			await act(async () => {
				result.current.mutate(123);
			});

			expect(markBookmarkAsRead).toHaveBeenCalledWith(123);
		});
	});
}
