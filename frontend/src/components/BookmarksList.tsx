"use client";

import { BookmarkCard } from "@/components/BookmarkCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Bookmark } from "@/types/bookmark";
import { useCallback, useEffect, useState } from "react";

interface BookmarksListProps {
	initialBookmarks: Bookmark[];
}

export function BookmarksList({ initialBookmarks }: BookmarksListProps) {
	const { getUnreadBookmarks } = useBookmarks();
	const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchBookmarks = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await getUnreadBookmarks();
			setBookmarks(data);
		} catch (e) {
			setError("ブックマークの取得に失敗しました");
			console.error("Error fetching bookmarks:", e);
		} finally {
			setIsLoading(false);
		}
	}, [getUnreadBookmarks]);

	useEffect(() => {
		fetchBookmarks();
	}, [fetchBookmarks]);

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">未読ブックマーク</h1>
				<button
					type="button"
					onClick={fetchBookmarks}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					disabled={isLoading}
				>
					{isLoading ? (
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

			{error && (
				<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm mb-6">
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{bookmarks.length === 0 ? (
				<p className="text-gray-600">未読のブックマークはありません。</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{bookmarks.map((bookmark) => (
						<div key={bookmark.id} data-testid="bookmark-item">
							<BookmarkCard bookmark={bookmark} onUpdate={fetchBookmarks} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
