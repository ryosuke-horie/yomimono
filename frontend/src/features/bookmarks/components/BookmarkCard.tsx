"use client";

import { useMarkBookmarkAsRead } from "@/features/bookmarks/queries/useMarkBookmarkAsRead";
import { useToggleFavoriteBookmark } from "@/features/bookmarks/queries/useToggleFavoriteBookmark";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { LabelDisplay } from "@/features/labels/components/LabelDisplay";
import { useState } from "react";
import { BookmarkSummary } from "./BookmarkSummary";

interface Props {
	bookmark: BookmarkWithLabel;
	onLabelClick?: (labelName: string) => void;
}

export function BookmarkCard({ bookmark, onLabelClick }: Props) {
	const {
		id,
		title,
		url,
		createdAt,
		isRead,
		isFavorite,
		label,
		summary,
		summaryUpdatedAt,
	} = bookmark;
	const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");

	const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
		useToggleFavoriteBookmark();
	const { mutate: markAsReadMutate, isPending: isMarkingAsRead } =
		useMarkBookmarkAsRead();
	const [isCopied, setIsCopied] = useState(false);
	const [isUrlCopied, setIsUrlCopied] = useState(false);

	const handleFavoriteToggle = () => {
		toggleFavorite({ id, isCurrentlyFavorite: isFavorite });
	};

	const handleShare = () => {
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			title || "",
		)}&url=${encodeURIComponent(url)}`;
		window.open(tweetUrl, "_blank");
	};

	const handleMarkAsRead = () => {
		markAsReadMutate(id);
	};

	// リンククリック時に既読にする処理を追加
	const handleLinkClick = () => {
		if (!isRead) {
			// 非同期で既読にする（結果を待たない）
			markAsReadMutate(id);
		}
	};

	// IDコピー処理
	const handleCopyId = async () => {
		try {
			await navigator.clipboard.writeText(id.toString());
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000); // 2秒後にリセット
		} catch (error) {
			console.error("クリップボードへのコピーに失敗しました", error);
		}
	};

	// URLコピー処理
	const handleCopyUrl = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setIsUrlCopied(true);
			setTimeout(() => setIsUrlCopied(false), 2000); // 2秒後にリセット
		} catch (error) {
			console.error("URLのコピーに失敗しました", error);
		}
	};

	return (
		<article
			className={`relative p-4 pb-16 border rounded-lg hover:shadow-md transition-shadow flex flex-col min-h-[150px] ${
				isRead ? "bg-gray-50" : ""
			}`}
		>
			{/* ラベル表示 */}
			{label && (
				<div className="absolute bottom-2 left-2 z-10">
					<LabelDisplay label={label} onClick={onLabelClick} />
				</div>
			)}

			{/* URLコピーボタン */}
			<button
				type="button"
				onClick={handleCopyUrl}
				className={`absolute bottom-2 right-36 p-1 rounded-full transition-colors ${
					isUrlCopied
						? "text-green-500 hover:text-green-600"
						: "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
				}`}
				title={isUrlCopied ? "URLをコピーしました！" : "URLをコピー"}
			>
				{isUrlCopied ? (
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
							d="M9 12.75L11.25 15 15 9.75m6-1.5c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
						/>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="w-6 h-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
						/>
					</svg>
				)}
			</button>

			{/* IDコピーボタン */}
			<button
				type="button"
				onClick={handleCopyId}
				className={`absolute bottom-2 right-28 p-1 rounded-full transition-colors ${
					isCopied
						? "text-green-500 hover:text-green-600"
						: "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
				}`}
				title={isCopied ? "コピーしました！" : `ID: ${id}をコピー`}
			>
				{isCopied ? (
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
							d="M9 12.75L11.25 15 15 9.75m6-1.5c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
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
							d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
						/>
					</svg>
				)}
			</button>

			{/* お気に入りボタン */}
			<button
				type="button"
				onClick={handleFavoriteToggle}
				disabled={isTogglingFavorite}
				className={`absolute bottom-2 right-20 p-1 rounded-full ${
					isTogglingFavorite
						? "text-gray-400"
						: isFavorite
							? "text-yellow-500 hover:text-yellow-600"
							: "text-gray-400 hover:text-yellow-500"
				}`}
				title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
			>
				{isTogglingFavorite ? (
					<div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill={isFavorite ? "currentColor" : "none"}
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
				disabled={isRead || isMarkingAsRead}
				className={`absolute bottom-2 right-2 p-1 rounded-full ${
					isRead
						? "text-green-500 cursor-default"
						: isMarkingAsRead
							? "text-gray-400"
							: "text-gray-400 hover:text-green-500 hover:bg-green-50"
				}`}
				title={isRead ? "既読済み" : "既読にする"}
			>
				{isMarkingAsRead ? (
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
					onClick={handleLinkClick}
				>
					{title || "タイトルなし"}
				</a>
			</h2>
			<p className="text-sm text-gray-600 line-clamp-1 mb-2" title={url}>
				{url}
			</p>
			<p className="text-xs text-gray-500">{formattedDate}</p>

			{/* 要約表示 */}
			<div className="mt-3 mb-12">
				<BookmarkSummary
					summary={summary || null}
					summaryUpdatedAt={summaryUpdatedAt || null}
				/>
			</div>
		</article>
	);
}
