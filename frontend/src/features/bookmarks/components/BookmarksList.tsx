"use client";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { bookmarkKeys } from "@/features/bookmarks/queries/queryKeys";
import { useGetFavoriteBookmarks } from "@/features/bookmarks/queries/useGetFavoriteBookmarks";
import { useGetUnreadBookmarks } from "@/features/bookmarks/queries/useGetUnreadBookmarks";
// import { useBookmarks } from "@/features/bookmarks/hooks/useBookmarks"; // 削除
import type { Bookmark } from "@/features/bookmarks/types";
// import { useCallback, useEffect, useState } from "react"; // 削除 (一部は react-query が提供)
import { useQueryClient } from "@tanstack/react-query"; // QueryClient をインポート

interface BookmarksListProps {
	// initialBookmarks は TanStack Query がキャッシュ管理するため不要
	mode?: "all" | "favorites";
}

export function BookmarksList({ mode = "all" }: BookmarksListProps) {
	const queryClient = useQueryClient(); // QueryClient インスタンスを取得

	// --- 新しいクエリフックを使用 ---
	const {
		data: unreadData,
		isLoading: isUnreadLoading,
		isError: isUnreadError,
		error: unreadError,
	} = useGetUnreadBookmarks();

	const {
		data: favoriteData,
		isLoading: isFavoriteLoading,
		isError: isFavoriteError,
		error: favoriteError,
	} = useGetFavoriteBookmarks();

	// 表示データと関連情報を決定
	const isLoading = mode === "all" ? isUnreadLoading : isFavoriteLoading;
	const isError = mode === "all" ? isUnreadError : isFavoriteError;
	const error = mode === "all" ? unreadError : favoriteError;
	// クエリのデータ構造に合わせて修正: unreadData は { bookmarks: [], ... }、favoriteData は []
	const displayData =
		mode === "all" ? (unreadData?.bookmarks ?? []) : (favoriteData ?? []);
	const totalUnread = unreadData?.totalUnread ?? 0;
	const todayReadCount = unreadData?.todayReadCount ?? 0;
	// --- ここまで追加 ---

	// 更新ボタンのハンドラ (キャッシュを無効化して再取得をトリガー)
	const handleRefresh = () => {
		const queryKey =
			mode === "all"
				? bookmarkKeys.list("unread")
				: bookmarkKeys.list("favorites");
		queryClient.invalidateQueries({ queryKey });
	};

	return (
		<div>
			{/* タイトル + 更新ボタン */}
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center">
					{mode === "all" ? (
						<>
							<h1 className="text-2xl font-bold">未読ブックマーク</h1>
							<div className="ml-2 flex gap-2">
								<span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
									{totalUnread}件 {/* unreadData から取得 */}
								</span>
								<span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
									今日{todayReadCount}件読了 {/* unreadData から取得 */}
								</span>
							</div>
						</>
					) : (
						<h1 className="text-2xl font-bold">お気に入り</h1>
					)}
				</div>
				<button
					type="button"
					onClick={handleRefresh} // handleUpdate を handleRefresh に変更
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					disabled={isLoading} // isFavLoading を削除し isLoading に統一
				>
					{isLoading ? ( // isFavLoading を削除し isLoading に統一
						<div className="flex items-center">
							<div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
							更新中...
						</div>
					) : (
						<>
							<svg
								className="mr-2 h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							更新
						</>
					)}
				</button>
			</div>

			{/* エラー表示 */}
			{isError && ( // error ではなく isError で判定
				<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm mb-6">
					<p className="text-red-700">
						{error instanceof Error
							? error.message
							: "ブックマークの取得に失敗しました"}
					</p>
				</div>
			)}

			{/* ローディング表示 */}
			{isLoading ? ( // isFavLoading を削除し isLoading に統一
				<div className="flex justify-center items-center p-8">
					<div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
				</div>
			) : displayData.length === 0 ? (
				<p className="text-gray-600">
					{mode === "favorites"
						? "お気に入りのブックマークはありません"
						: "未読のブックマークはありません"}
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
					{displayData.map((bookmark) => (
						<div
							key={bookmark.id}
							data-testid="bookmark-item"
							className="mx-auto w-full max-w-sm"
						>
							<BookmarkCard bookmark={bookmark} /> {/* onUpdate を削除 */}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
