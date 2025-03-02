"use client";

import type { Bookmark } from "@/types/bookmark";

interface Props {
	bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: Props) {
	const { title, url, createdAt } = bookmark;
	const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");

	return (
		<div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
			<h2 className="font-bold mb-2">
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
		</div>
	);
}
