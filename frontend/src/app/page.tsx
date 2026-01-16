"use client";

import { useQuery } from "@tanstack/react-query";
import { BookmarksList } from "@/features/bookmarks/components/BookmarksList";
import {
	type BookmarksData,
	getBookmarks,
} from "@/features/bookmarks/queries/api";
import { bookmarkKeys } from "@/features/bookmarks/queries/queryKeys";

export default function HomePage() {
	// ブックマーク一覧取得
	const {
		data: responseData,
		isLoading: isLoadingBookmarks,
		error: errorBookmarks,
	} = useQuery<BookmarksData, Error>({
		queryKey: bookmarkKeys.list("unread"),
		queryFn: () => getBookmarks(),
		staleTime: 1 * 60 * 1000, // 1分間キャッシュを有効にする
	});

	const totalUnread = responseData?.totalUnread;
	const todayReadCount = responseData?.todayReadCount;

	const bookmarksToDisplay = responseData?.bookmarks ?? [];

	// エラーハンドリング
	if (errorBookmarks) {
		return (
			<main className="container mx-auto px-4 py-8 text-red-500">
				ブックマークの読み込みに失敗しました: {errorBookmarks.message}
			</main>
		);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			{/* 未読数と既読数を表示 */}
			<div className="mb-4">
				{!isLoadingBookmarks &&
					totalUnread !== undefined &&
					todayReadCount !== undefined && (
						<div className="text-sm text-gray-600">
							<span>未読: {totalUnread}件</span>
							<span className="ml-4">本日既読: {todayReadCount}件</span>
						</div>
					)}
			</div>

			{/* ブックマークリスト */}
			{isLoadingBookmarks ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* スケルトンローディング表示 (簡易版) */}
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="border rounded-lg p-4 h-[150px] bg-gray-100 animate-pulse"
						/>
					))}
				</div>
			) : (
				<BookmarksList bookmarks={bookmarksToDisplay} />
			)}
		</main>
	);
}
