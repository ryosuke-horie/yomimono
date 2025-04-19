"use client";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";

interface BookmarksListProps {
	bookmarks: BookmarkWithLabel[];
	onLabelClick?: (labelName: string) => void;
}

export function BookmarksList({ bookmarks, onLabelClick }: BookmarksListProps) {
	if (bookmarks.length === 0) {
		return <p className="text-gray-600">表示するブックマークはありません。</p>;
	}

	return (
		<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{/* grid-cols-3 と xl:grid-cols-4 に変更 */}
			{bookmarks.map((bookmark) => (
				<div
					key={bookmark.id}
					data-testid="bookmark-item"
					className="mx-auto w-full max-w-sm"
				>
					<BookmarkCard bookmark={bookmark} onLabelClick={onLabelClick} />{" "}
					{/* onLabelClick を渡す */}
				</div>
			))}
		</div>
	);
}
