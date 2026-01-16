"use client";

import { useQuery } from "@tanstack/react-query";
import { BookmarksList } from "@/features/bookmarks/components/BookmarksList";
import {
	type FavoritesData,
	getFavoriteBookmarks,
} from "@/features/bookmarks/queries/api";
import { bookmarkKeys } from "@/features/bookmarks/queries/queryKeys";

export default function FavoritesPage() {
	const {
		data: responseData,
		isLoading: isLoadingBookmarks,
		error: errorBookmarks,
	} = useQuery<FavoritesData, Error>({
		queryKey: bookmarkKeys.list("favorites"),
		queryFn: getFavoriteBookmarks,
		staleTime: 1 * 60 * 1000,
	});

	const bookmarks = responseData?.bookmarks ?? [];

	if (errorBookmarks) {
		return (
			<main className="container mx-auto px-4 py-8 text-red-500">
				お気に入りブックマークの読み込みに失敗しました: {errorBookmarks.message}
			</main>
		);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">お気に入り</h1>

			{isLoadingBookmarks ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="border rounded-lg p-4 h-[150px] bg-gray-100 animate-pulse"
						/>
					))}
				</div>
			) : (
				<BookmarksList bookmarks={bookmarks} />
			)}
		</main>
	);
}
