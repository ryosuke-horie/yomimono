import { useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDeleteRSSFeed } from "../queries/useRSSFeeds";
import type { RSSFeed } from "../types";
import { EditFeedModal } from "./EditFeedModal";

interface FeedCardProps {
	feed: RSSFeed;
}

export function FeedCard({ feed }: FeedCardProps) {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const { mutate: deleteFeed, isPending: isDeleting } = useDeleteRSSFeed();

	const handleDelete = () => {
		deleteFeed(feed.id, {
			onSuccess: () => {
				setIsDeleteDialogOpen(false);
			},
		});
	};

	// 最終更新時刻をフォーマット
	const formatLastFetch = (date: string | null) => {
		if (!date) return "まだ取得されていません";

		const fetchDate = new Date(date);
		const now = new Date();
		const diffMinutes = Math.floor(
			(now.getTime() - fetchDate.getTime()) / (1000 * 60),
		);

		if (diffMinutes < 60) {
			return `${diffMinutes}分前`;
		}
		if (diffMinutes < 1440) {
			return `${Math.floor(diffMinutes / 60)}時間前`;
		}
		return `${Math.floor(diffMinutes / 1440)}日前`;
	};

	// ステータスインジケーター
	const statusColor = feed.isActive ? "bg-green-500" : "bg-gray-400";

	return (
		<>
			<div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
				<div className="flex justify-between items-start mb-2">
					<h3 className="font-bold text-lg">{feed.name}</h3>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setIsEditModalOpen(true)}
						>
							編集
						</Button>
						<Button
							variant="danger"
							size="sm"
							onClick={() => setIsDeleteDialogOpen(true)}
						>
							削除
						</Button>
					</div>
				</div>

				<p className="text-sm text-gray-600 mb-3 truncate" title={feed.url}>
					URL: {feed.url}
				</p>

				<div className="flex items-center gap-4 text-sm">
					<span className="text-gray-600">
						最終更新: {formatLastFetch(feed.lastFetchedAt)}
					</span>
					<div className="flex items-center gap-1">
						<span className="text-gray-600">ステータス:</span>
						<div className={`w-3 h-3 rounded-full ${statusColor}`} />
					</div>
				</div>
			</div>

			<EditFeedModal
				feed={feed}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
			/>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={handleDelete}
				title="フィードの削除"
				message="このフィードを削除してもよろしいですか？"
				isLoading={isDeleting}
			/>
		</>
	);
}
