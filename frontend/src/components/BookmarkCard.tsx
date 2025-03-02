"use client";

import { markBookmarkAsRead } from "@/lib/api/bookmarks";
import type { Bookmark } from "@/types/bookmark";

interface Props {
	bookmark: Bookmark;
	onUpdate?: () => void;
}

export function BookmarkCard({ bookmark, onUpdate }: Props) {
	const { id, title, url, createdAt, isRead } = bookmark;
	const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");

	const handleMarkAsRead = async () => {
		try {
			await markBookmarkAsRead(id);
			onUpdate?.();
		} catch (error) {
			console.error("Failed to mark as read:", error);
		}
	};

	return (
		<article
			className={`p-4 border rounded-lg hover:shadow-md transition-shadow relative ${isRead ? "bg-gray-50" : ""}`}
		>
			<button
				type="button"
				onClick={handleMarkAsRead}
				disabled={isRead}
				className={`absolute top-2 right-2 p-1 rounded-full ${
					isRead
						? "text-green-500 cursor-default"
						: "text-gray-400 hover:text-green-500 hover:bg-green-50"
				}`}
				title={isRead ? "既読済み" : "既読にする"}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-6 h-6"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</button>
			<h2 className="font-bold mb-2 pr-8">
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-blue-600"
				>
					{title || "タイトルなし"}
				</a>
			</h2>
			<p className="text-sm text-gray-600 truncate mb-2">{url}</p>
			<p className="text-xs text-gray-500">{formattedDate}</p>
		</article>
	);
}
