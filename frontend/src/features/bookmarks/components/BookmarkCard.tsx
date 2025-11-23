"use client";

import { BookmarkLabelSelector } from "@/features/bookmarks/components/BookmarkLabelSelector";
import { useAssignLabelToBookmark } from "@/features/bookmarks/queries/useAssignLabelToBookmark";
import { useMarkBookmarkAsRead } from "@/features/bookmarks/queries/useMarkBookmarkAsRead";
import { useMarkBookmarkAsUnread } from "@/features/bookmarks/queries/useMarkBookmarkAsUnread";
import { useToggleFavoriteBookmark } from "@/features/bookmarks/queries/useToggleFavoriteBookmark";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import type { Label } from "@/features/labels/types";
import { useToast } from "@/hooks/useToast";

interface Props {
	bookmark: BookmarkWithLabel;
	availableLabels?: Label[];
}

export function BookmarkCard({ bookmark, availableLabels }: Props) {
	const { id, title, url, createdAt, isRead, isFavorite, label } = bookmark;
	const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");

	const { showToast } = useToast();
	const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
		useToggleFavoriteBookmark({ showToast });
	const { mutate: markAsReadMutate } = useMarkBookmarkAsRead({ showToast });
	const { mutate: markAsUnreadMutate, isPending: isMarkingAsUnread } =
		useMarkBookmarkAsUnread({ showToast });
	const { mutate: assignLabelMutate, isPending: isAssigningLabel } =
		useAssignLabelToBookmark();

	const handleFavoriteToggle = () => {
		toggleFavorite({ id, isCurrentlyFavorite: isFavorite });
	};

	const handleMarkAsUnread = () => {
		markAsUnreadMutate(id);
	};

	// リンククリック時に既読にする処理を追加
	const handleLinkClick = () => {
		if (!isRead) {
			// 非同期で既読にする（結果を待たない）
			markAsReadMutate(id);
		}
	};

	const handleLabelSelect = (nextLabel: Label) => {
		if (!label || label.name === nextLabel.name) {
			return;
		}
		assignLabelMutate({
			bookmarkId: id,
			labelName: nextLabel.name,
			optimisticLabel: nextLabel,
		});
	};

	return (
		<article
			className={`relative p-4 pb-16 border rounded-lg hover:shadow-md transition-shadow flex flex-col h-[200px] ${
				isRead ? "bg-gray-50" : ""
			}`}
		>
			{/* ラベル表示 */}
			{label && (
				<div
					className="absolute bottom-2 left-2 z-10"
					data-testid="label-container"
				>
			<BookmarkLabelSelector
				label={label}
				availableLabels={availableLabels ?? []}
				onSelect={handleLabelSelect}
				isUpdating={isAssigningLabel}
			/>
				</div>
			)}

			{/* アクションボタンを右下にまとめて配置 */}
			<div className="absolute bottom-2 right-2 flex items-center gap-2">
				{/* お気に入りボタン */}
				<button
					type="button"
					onClick={handleFavoriteToggle}
					disabled={isTogglingFavorite}
					className={`p-1 rounded-full ${
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
				{/* 未読に戻すボタン */}
				{isRead && (
					<button
						type="button"
						onClick={handleMarkAsUnread}
						disabled={isMarkingAsUnread}
						className={`p-1 rounded-full ${
							isMarkingAsUnread
								? "text-gray-400"
								: "text-green-500 hover:text-blue-500 hover:bg-blue-50"
						}`}
						title="未読に戻す"
					>
						{isMarkingAsUnread ? (
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
									d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						)}
					</button>
				)}
			</div>

			{/* コンテンツ */}
			<h2
				className="font-bold mb-2 line-clamp-3"
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
		</article>
	);
}
