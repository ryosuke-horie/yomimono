"use client";

import { BookmarkCard } from "@/components/BookmarkCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Bookmark } from "@/types/bookmark";
import { useCallback, useEffect, useState } from "react";

interface BookmarksListProps {
	initialBookmarks?: Bookmark[];
	mode?: "all" | "favorites";
}

export function BookmarksList({
	initialBookmarks = [],
	mode = "all",
}: BookmarksListProps) {
	const {
		getUnreadBookmarks,
		favorites,
		isLoading: isFavLoading,
		fetchFavorites,
	} = useBookmarks();

	const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
	const [totalUnread, setTotalUnread] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [displayData, setDisplayData] = useState<Bookmark[]>([]);

	const fetchBookmarks = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const { bookmarks: fetchedBookmarks, totalUnread: fetchedTotal } =
				await getUnreadBookmarks();
			setBookmarks(fetchedBookmarks);
			setTotalUnread(fetchedTotal);
		} catch (e) {
			setError("ブックマークの取得に失敗しました");
			console.error("Error fetching bookmarks:", e);
		} finally {
			setIsLoading(false);
		}
	}, [getUnreadBookmarks]);

	useEffect(() => {
		if (mode === "all") {
			fetchBookmarks();
		}
	}, [fetchBookmarks, mode]);

	useEffect(() => {
		setDisplayData(mode === "favorites" ? favorites : bookmarks);
	}, [mode, favorites, bookmarks]);

	const handleUpdate = mode === "favorites" ? fetchFavorites : fetchBookmarks;

	return (
		<div>
			{/* タイトル + 更新ボタン */}
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center">
					{mode === "all" ? (
						<>
							<h1 className="text-2xl font-bold">未読ブックマーク</h1>
							<span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
								{totalUnread}
							</span>
						</>
					) : (
						<h1 className="text-2xl font-bold">お気に入り</h1>
					)}
				</div>
				<button
					type="button"
					onClick={handleUpdate}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					disabled={isLoading || isFavLoading}
				>
					{isLoading || isFavLoading ? (
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
			{error && (
				<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm mb-6">
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{/* ローディング表示 */}
			{isLoading || isFavLoading ? (
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
							<BookmarkCard bookmark={bookmark} onUpdate={handleUpdate} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
