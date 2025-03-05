"use client";

import { useBookmarks } from "@/hooks/useBookmarks";
import type { Bookmark } from "@/types/bookmark";
import { useState } from "react";

interface Props {
	bookmark: Bookmark;
	onUpdate?: () => void;
}

export function BookmarkCard({ bookmark, onUpdate }: Props) {
	const { markAsRead } = useBookmarks();

	const { id, title, url, createdAt, isRead } = bookmark;
	const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");

	const [isMarking, setIsMarking] = useState(false);

	const handleMarkAsRead = async () => {
		try {
			setIsMarking(true);
			await markAsRead(id);
			onUpdate?.();
		} catch (error) {
			console.error("Failed to mark as read:", error);
		} finally {
			setIsMarking(false);
		}
	};

	return (
		<article
			className={`p-4 border rounded-lg hover:shadow-md transition-shadow flex flex-col min-h-[150px] ${isRead ? "bg-gray-50" : ""}`}
		>
			<button
				type="button"
				onClick={handleMarkAsRead}
				disabled={isRead || isMarking}
				className={`absolute top-2 right-2 p-1 rounded-full ${
					isRead
						? "text-green-500 cursor-default"
						: isMarking
							? "text-gray-400"
							: "text-gray-400 hover:text-green-500 hover:bg-green-50"
				}`}
				title={isRead ? "既読済み" : "既読にする"}
			>
				{isMarking ? (
					<svg
						className="animate-spin w-6 h-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						role="status"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				) : (
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
				)}
			</button>
			<h2
				className="font-bold mb-2 pr-8 line-clamp-2"
				title={title || "タイトルなし"}
			>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-blue-600"
				>
					{title || "タイトルなし"}
				</a>
			</h2>
			<p className="text-sm text-gray-600 line-clamp-1 mb-2" title={url}>
				{url}
			</p>
			<p className="text-xs text-gray-500 mt-auto">{formattedDate}</p>
		</article>
	);
}
