"use client";

import { useMarkBookmarkAsRead } from "@/features/bookmarks/queries/useMarkBookmarkAsRead";
import { useToggleFavoriteBookmark } from "@/features/bookmarks/queries/useToggleFavoriteBookmark";
import type { Bookmark } from "@/features/bookmarks/types";

interface Props {
	bookmark: Bookmark;
	// onUpdate は不要
}

export function BookmarkCard({ bookmark }: Props) {
	const { id, title, url, createdAt, isRead, isFavorite } = bookmark;
	const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");

	// 新しいミューテーションフックを使用
	const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
		useToggleFavoriteBookmark();
	const { mutate: markAsReadMutate, isPending: isMarkingAsRead } =
		useMarkBookmarkAsRead();

	const handleFavoriteToggle = () => {
		// mutate 関数を呼び出す
		toggleFavorite({ id, isCurrentlyFavorite: isFavorite });
	};

	const handleShare = () => {
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			title || "",
		)}&url=${encodeURIComponent(url)}`;
		window.open(tweetUrl, "_blank");
	};

	const handleMarkAsRead = () => {
		// mutate 関数を呼び出す
		markAsReadMutate(id);
	};

	return (
		<article
			className={`relative p-4 border rounded-lg hover:shadow-md transition-shadow flex flex-col min-h-[150px] ${
				isRead ? "bg-gray-50" : ""
			}`}
		>
			{/* お気に入りボタン */}
			<button
				type="button"
				onClick={handleFavoriteToggle}
				disabled={isTogglingFavorite} // isPending を使用
				className={`absolute bottom-2 right-20 p-1 rounded-full ${
					isTogglingFavorite // isPending を使用
						? "text-gray-400"
						: isFavorite // isFavorite を使用
							? "text-yellow-500 hover:text-yellow-600"
							: "text-gray-400 hover:text-yellow-500"
				}`}
				title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"} // isFavorite を使用
			>
				{isTogglingFavorite ? ( // isPending を使用
					<div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill={isFavorite ? "currentColor" : "none"} // isFavorite を使用
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="w-6 h-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
						/>
					</svg>
				)}
			</button>

			{/* シェアボタン */}
			<button
				type="button"
				onClick={handleShare}
				className="absolute bottom-2 right-10 p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50"
				title="Xでシェア"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					className="w-6 h-6"
				>
					<path
						fill="currentColor"
						d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
					/>
				</svg>
			</button>

			{/* 既読ボタン */}
			<button
				type="button"
				onClick={handleMarkAsRead}
				disabled={isRead || isMarkingAsRead} // isPending を使用
				className={`absolute bottom-2 right-2 p-1 rounded-full ${
					isRead
						? "text-green-500 cursor-default"
						: isMarkingAsRead // isPending を使用
							? "text-gray-400"
							: "text-gray-400 hover:text-green-500 hover:bg-green-50"
				}`}
				title={isRead ? "既読済み" : "既読にする"}
			>
				{isMarkingAsRead ? ( // isPending を使用
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

			{/* コンテンツ */}
			<h2
				className="font-bold mb-2 line-clamp-2"
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
			<p className="text-xs text-gray-500">{formattedDate}</p>
		</article>
	);
}
