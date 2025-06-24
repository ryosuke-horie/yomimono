"use client";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { useGetRecentBookmarks } from "@/features/bookmarks/queries/useGetRecentBookmarks";
import type { Bookmark } from "@/features/bookmarks/types";

export default function RecentPage() {
	const {
		data: groupedBookmarks = {} as { [date: string]: Bookmark[] },
		isLoading,
		isError,
		error,
	} = useGetRecentBookmarks();

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const dateOnly = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);
		const todayOnly = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);
		const yesterdayOnly = new Date(
			yesterday.getFullYear(),
			yesterday.getMonth(),
			yesterday.getDate(),
		);

		if (dateOnly.getTime() === todayOnly.getTime()) {
			return "今日";
		}
		if (dateOnly.getTime() === yesterdayOnly.getTime()) {
			return "昨日";
		}
		return `${date.getMonth() + 1}月${date.getDate()}日`;
	};

	// groupedBookmarks は useQuery から取得するため、ソートロジックはそのまま
	const sortedDates = Object.keys(groupedBookmarks).sort((a, b) => {
		return new Date(b).getTime() - new Date(a).getTime();
	});

	if (isLoading) {
		return (
			<main className="container mx-auto px-4 py-8">
				<div className="text-center py-10">
					{/* より明確なローディング表示 */}
					<div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full" />
				</div>
			</main>
		);
	}

	if (isError) {
		return (
			<main className="container mx-auto px-4 py-8">
				{/* エラー表示を追加 */}
				<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm">
					<p className="text-red-700">
						{error instanceof Error
							? error.message
							: "最近読んだ記事の取得に失敗しました"}
					</p>
				</div>
			</main>
		);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">最近読んだ記事</h1>

			{sortedDates.length === 0 ? (
				<div className="text-center py-10 text-gray-500">
					<p>最近読んだ記事はありません</p>
				</div>
			) : (
				sortedDates.map((date) => (
					<div key={date} className="mb-8">
						<h2 className="text-xl font-semibold mb-4 border-b pb-2">
							{formatDate(date)}
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{groupedBookmarks[date].map((bookmark) => (
								<BookmarkCard key={bookmark.id} bookmark={bookmark} />
							))}
						</div>
					</div>
				))
			)}
		</main>
	);
}
