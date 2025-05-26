/**
 * ブックマークのお気に入り状態を切り替えるカスタムフック
 * 楽観的更新で複数のキャッシュを即座に更新
 */
import type { Bookmark } from "@/features/bookmarks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBookmarkToFavorites, removeBookmarkFromFavorites } from "./api";
import type { BookmarksData } from "./api";
import { bookmarkKeys } from "./queryKeys";

interface ToggleFavoriteVariables {
	id: number;
	isCurrentlyFavorite: boolean; // 現在の状態を渡して、逆の操作を行う
}

export const useToggleFavoriteBookmark = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, isCurrentlyFavorite }: ToggleFavoriteVariables) =>
			// isCurrentlyFavorite の値に基づいて、追加または削除のAPI関数を呼び出す
			isCurrentlyFavorite
				? removeBookmarkFromFavorites(id)
				: addBookmarkToFavorites(id),

		// --- 楽観的更新 ---
		onMutate: async ({ id, isCurrentlyFavorite }: ToggleFavoriteVariables) => {
			const newIsFavorite = !isCurrentlyFavorite;

			// 関連する可能性のあるクエリをキャンセル
			await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });

			// ロールバック用に現在の未読リストキャッシュを保存
			const previousUnreadData = queryClient.getQueryData<BookmarksData>(
				bookmarkKeys.list("unread"),
			);
			// ロールバック用にお気に入りリストキャッシュを保存
			const previousFavoriteData = queryClient.getQueryData<Bookmark[]>(
				bookmarkKeys.list("favorites"),
			);
			// ロールバック用に最近読んだ記事リストキャッシュを保存
			const previousRecentData = queryClient.getQueryData<{
				[date: string]: Bookmark[];
			}>(bookmarkKeys.list("recent"));

			// 未読リストキャッシュを即時更新 (isFavorite を反転)
			if (previousUnreadData) {
				queryClient.setQueryData<BookmarksData | undefined>(
					bookmarkKeys.list("unread"),
					(oldData) =>
						oldData
							? {
									...oldData,
									bookmarks: oldData.bookmarks.map((bookmark) =>
										bookmark.id === id
											? { ...bookmark, isFavorite: newIsFavorite }
											: bookmark,
									),
								}
							: undefined,
				);
			}

			// お気に入りリストキャッシュを即時更新
			if (previousFavoriteData) {
				queryClient.setQueryData<Bookmark[] | undefined>(
					bookmarkKeys.list("favorites"),
					(oldData) => {
						if (!oldData) return undefined;
						if (newIsFavorite) {
							// お気に入りに追加する場合:
							// 未読リストのキャッシュから該当ブックマークを探す (存在する場合)
							const bookmarkToAdd = previousUnreadData?.bookmarks.find(
								(b) => b.id === id,
							);
							// 見つからない、または既にお気に入りリストに追加済みの場合は何もしない
							if (!bookmarkToAdd || oldData.some((b) => b.id === id)) {
								return oldData;
							}
							// お気に入りリストに追加
							return [...oldData, { ...bookmarkToAdd, isFavorite: true }];
						}
						// お気に入りから削除する場合: 該当ブックマークをリストから除外
						return oldData.filter((bookmark) => bookmark.id !== id);
					},
				);
			}

			// 最近読んだ記事リストキャッシュも即時更新 (isFavorite を反転)
			if (previousRecentData) {
				queryClient.setQueryData<{ [date: string]: Bookmark[] } | undefined>(
					bookmarkKeys.list("recent"),
					(oldData) => {
						if (!oldData) return undefined;
						const newData = { ...oldData };
						for (const date in newData) {
							newData[date] = newData[date].map((bookmark) =>
								bookmark.id === id
									? { ...bookmark, isFavorite: newIsFavorite }
									: bookmark,
							);
						}
						return newData;
					},
				);
			}

			// ロールバック用に全てのスナップショットをコンテキストとして返す
			return { previousUnreadData, previousFavoriteData, previousRecentData };
		},

		// エラー発生時の処理
		onError: (err, variables, context) => {
			console.error(
				`Failed to toggle favorite for bookmark ${variables.id}:`,
				err,
			);
			// 保存しておいたデータで両方のキャッシュを元に戻す (ロールバック)
			if (context?.previousUnreadData) {
				queryClient.setQueryData(
					bookmarkKeys.list("unread"),
					context.previousUnreadData,
				);
			}
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
			// 必要に応じて関連クエリを無効化し、サーバーと再同期
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

	// API関数のモック
	vi.mock("./api", () => ({
		addBookmarkToFavorites: vi.fn(),
		removeBookmarkFromFavorites: vi.fn(),
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

	describe("useToggleFavoriteBookmark", () => {
		let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

		beforeEach(() => {
			wrapper = createTestWrapper();
			vi.clearAllMocks();
		});

		it("お気に入り切り替えのmutationが正しく初期化される", () => {
			const { result } = renderHook(() => useToggleFavoriteBookmark(), {
				wrapper,
			});

			expect(result.current.mutate).toBeDefined();
			expect(result.current.mutateAsync).toBeDefined();
			expect(result.current.isPending).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.isSuccess).toBe(false);
		});

		it("お気に入り追加時に正しいAPIが呼ばれる", async () => {
			const { addBookmarkToFavorites } = await import("./api");
			vi.mocked(addBookmarkToFavorites).mockResolvedValue({ success: true });

			const { result } = renderHook(() => useToggleFavoriteBookmark(), {
				wrapper,
			});

			await act(async () => {
				result.current.mutate({ id: 1, isCurrentlyFavorite: false });
			});

			expect(addBookmarkToFavorites).toHaveBeenCalledWith(1);
		});

		it("お気に入り削除時に正しいAPIが呼ばれる", async () => {
			const { removeBookmarkFromFavorites } = await import("./api");
			vi.mocked(removeBookmarkFromFavorites).mockResolvedValue({
				success: true,
			});

			const { result } = renderHook(() => useToggleFavoriteBookmark(), {
				wrapper,
			});

			await act(async () => {
				result.current.mutate({ id: 1, isCurrentlyFavorite: true });
			});

			expect(removeBookmarkFromFavorites).toHaveBeenCalledWith(1);
		});
	});
}
