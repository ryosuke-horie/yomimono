"use client";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";

interface BookmarksListProps {
	bookmarks: BookmarkWithLabel[];
}

export function BookmarksList({ bookmarks }: BookmarksListProps) {
	if (bookmarks.length === 0) {
		return <p className="text-gray-600">表示するブックマークはありません。</p>;
	}

	return (
		<div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
			{bookmarks.map((bookmark) => (
				<div key={bookmark.id} data-testid="bookmark-item">
					<BookmarkCard bookmark={bookmark} />
				</div>
			))}
		</div>
	);
}
