"use client";

import React, { useEffect, useState } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { BookmarkCard } from "@/components/BookmarkCard";
import type { Bookmark } from "@/types/bookmark";

interface GroupedBookmarks {
	[date: string]: Bookmark[];
}

export default function RecentPage() {
	const [groupedBookmarks, setGroupedBookmarks] = useState<GroupedBookmarks>({});
	const [isLoading, setIsLoading] = useState(true);
	const { getRecentlyReadBookmarks } = useBookmarks();

	useEffect(() => {
		const fetchRecentlyReadBookmarks = async () => {
			try {
				setIsLoading(true);
				const data = await getRecentlyReadBookmarks();
				setGroupedBookmarks(data);
			} catch (error) {
				console.error("Failed to fetch recently read bookmarks:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecentlyReadBookmarks();
	}, [getRecentlyReadBookmarks]);

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		
		const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
		
		if (dateOnly.getTime() === todayOnly.getTime()) {
			return "今日";
		} else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
			return "昨日";
		} else {
			return `${date.getMonth() + 1}月${date.getDate()}日`;
		}
	};

	const sortedDates = Object.keys(groupedBookmarks).sort((a, b) => {
		return new Date(b).getTime() - new Date(a).getTime();
	});

	if (isLoading) {
		return (
			<main className="container mx-auto px-4 py-8">
				<div className="text-center py-10">読み込み中...</div>
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
						<h2 className="text-xl font-semibold mb-4 border-b pb-2">{formatDate(date)}</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{groupedBookmarks[date].map((bookmark) => (
								<BookmarkCard
									key={bookmark.id}
									bookmark={bookmark}
									onUpdate={() => {
									}}
								/>
							))}
						</div>
					</div>
				))
			)}
		</main>
	);
}
